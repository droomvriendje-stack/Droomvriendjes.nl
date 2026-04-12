"""
Meta Conversions API (CAPI) — Server-Side Tracking Routes

Sends conversion events directly from the backend to Meta's Conversions API,
bypassing browser-based pixel restrictions (ad blockers, iOS 14.5+ ATT).

Endpoints:
    POST /api/tracking/meta/purchase       — Purchase event
    POST /api/tracking/meta/add-to-cart    — AddToCart event
    POST /api/tracking/meta/lead           — Lead event
    POST /api/tracking/meta/view-content   — ViewContent event

Environment variables required:
    META_ACCESS_TOKEN   — System user access token from Meta Business Manager
    META_PIXEL_ID       — Your Meta Pixel ID

All PII is hashed with SHA-256 before transmission.
Events are logged to the Supabase `tracking_events` table for audit trail.

Meta CAPI docs: https://developers.facebook.com/docs/marketing-api/conversions-api
"""
import os
import uuid
import asyncio
import logging
import json
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Request

from models.tracking import (
    MetaPurchaseEvent,
    MetaAddToCartEvent,
    MetaLeadEvent,
    MetaViewContentEvent,
    TrackingEventResponse,
)
from utils.tracking_hashing import hash_user_data
from utils.tracking_deduplication import check_duplicate_event, store_event_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tracking/meta", tags=["tracking-meta"])

# ---------------------------------------------------------------------------
# Module-level state (injected by server.py)
# ---------------------------------------------------------------------------
supabase = None


def set_supabase_client(client) -> None:
    """Inject the Supabase client from the main application."""
    global supabase
    supabase = client
    logger.info("✅ Supabase client set for Meta CAPI tracking route")


# ---------------------------------------------------------------------------
# Meta CAPI configuration
# ---------------------------------------------------------------------------
META_CAPI_URL = "https://graph.facebook.com/v19.0/{pixel_id}/events"
_MAX_RETRIES = 3
_RETRY_BACKOFF_BASE = 1.0  # seconds


def _get_meta_config() -> tuple[str, str]:
    """Return (access_token, pixel_id) from environment, raising if missing."""
    token = os.environ.get("META_ACCESS_TOKEN", "")
    pixel_id = os.environ.get("META_PIXEL_ID", "")
    if not token:
        raise HTTPException(
            status_code=503,
            detail="META_ACCESS_TOKEN is not configured on this server.",
        )
    if not pixel_id:
        raise HTTPException(
            status_code=503,
            detail="META_PIXEL_ID is not configured on this server.",
        )
    return token, pixel_id


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _send_to_meta(
    pixel_id: str,
    access_token: str,
    payload: dict,
) -> dict:
    """
    POST the event payload to Meta CAPI with exponential-backoff retry.

    Args:
        pixel_id:     Meta Pixel ID.
        access_token: System user access token.
        payload:      Full CAPI request body (dict).

    Returns:
        Parsed JSON response from Meta.

    Raises:
        HTTPException: If all retries are exhausted.
    """
    url = META_CAPI_URL.format(pixel_id=pixel_id)
    params = {"access_token": access_token}

    last_exc: Optional[Exception] = None
    for attempt in range(_MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, params=params, json=payload)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            logger.warning(
                f"Meta CAPI HTTP error (attempt {attempt + 1}/{_MAX_RETRIES}): "
                f"{exc.response.status_code} — {exc.response.text}"
            )
            last_exc = exc
            # 4xx errors are not retryable
            if exc.response.status_code < 500:
                raise HTTPException(
                    status_code=exc.response.status_code,
                    detail=f"Meta CAPI rejected the request: {exc.response.text}",
                )
        except Exception as exc:
            logger.warning(
                f"Meta CAPI request error (attempt {attempt + 1}/{_MAX_RETRIES}): {exc}"
            )
            last_exc = exc

        if attempt < _MAX_RETRIES - 1:
            await asyncio.sleep(_RETRY_BACKOFF_BASE * (2 ** attempt))

    raise HTTPException(
        status_code=502,
        detail=f"Meta CAPI unreachable after {_MAX_RETRIES} attempts: {last_exc}",
    )


async def _log_event(
    event_type: str,
    event_id: str,
    user_data: dict,
    custom_data: Optional[dict],
    status: str,
    response: Optional[dict],
) -> Optional[str]:
    """
    Persist a tracking event record to Supabase `tracking_events` table.

    Returns the UUID of the inserted row, or None if logging failed.
    """
    if supabase is None:
        return None
    try:
        log_id = str(uuid.uuid4())
        record = {
            "id": log_id,
            "event_type": event_type,
            "platform": "meta",
            "event_id": event_id,
            "user_data": user_data,
            "custom_data": custom_data,
            "status": status,
            "response": response,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        supabase.table("tracking_events").insert(record).execute()
        logger.info(f"📊 Meta CAPI event logged: {event_type} (log_id={log_id})")
        return log_id
    except Exception as exc:
        logger.error(f"Failed to log Meta CAPI event to Supabase: {exc}")
        return None


def _build_capi_payload(
    event_name: str,
    event_id: str,
    hashed_user: dict,
    custom_data: Optional[dict],
    content_name: Optional[str],
    event_source_url: Optional[str],
    action_source: str,
) -> dict:
    """Construct the Meta CAPI request body."""
    event_time = int(datetime.now(timezone.utc).timestamp())

    event: dict = {
        "event_name": event_name,
        "event_time": event_time,
        "event_id": event_id,
        "action_source": action_source,
        "user_data": hashed_user,
    }

    if event_source_url:
        event["event_source_url"] = event_source_url

    built_custom: dict = {}
    if custom_data:
        if custom_data.get("value") is not None:
            built_custom["value"] = custom_data["value"]
        if custom_data.get("currency"):
            built_custom["currency"] = custom_data["currency"]
        if custom_data.get("content_ids"):
            built_custom["content_ids"] = custom_data["content_ids"]
        if custom_data.get("content_type"):
            built_custom["content_type"] = custom_data["content_type"]
        if custom_data.get("num_items") is not None:
            built_custom["num_items"] = custom_data["num_items"]
        if custom_data.get("order_id"):
            built_custom["order_id"] = custom_data["order_id"]

    if content_name:
        built_custom["content_name"] = content_name

    if built_custom:
        event["custom_data"] = built_custom

    return {
        "data": [event],
        # test_event_code can be added here during development:
        # "test_event_code": "TEST12345",
    }


async def _process_meta_event(
    event_name: str,
    user_data_raw: dict,
    custom_data_raw: Optional[dict],
    content_name: Optional[str],
    event_id: Optional[str],
    event_source_url: Optional[str],
    action_source: str,
) -> TrackingEventResponse:
    """
    Core logic shared by all Meta CAPI endpoint handlers.

    1. Resolve / generate event_id
    2. Check for duplicates
    3. Hash PII
    4. Build and send CAPI payload
    5. Log to Supabase
    """
    # 1. Resolve event_id
    resolved_event_id = event_id or str(uuid.uuid4())

    # 2. Deduplication check
    if check_duplicate_event(resolved_event_id):
        logger.info(
            f"⚠️ Duplicate Meta CAPI event skipped: {event_name} (event_id={resolved_event_id})"
        )
        return TrackingEventResponse(
            success=True,
            event_id=resolved_event_id,
            platform="meta",
            event_type=event_name,
            message="Duplicate event skipped",
        )

    # 3. Hash PII
    hashed_user = hash_user_data(user_data_raw)

    # 4. Build payload and send
    access_token, pixel_id = _get_meta_config()
    payload = _build_capi_payload(
        event_name=event_name,
        event_id=resolved_event_id,
        hashed_user=hashed_user,
        custom_data=custom_data_raw,
        content_name=content_name,
        event_source_url=event_source_url,
        action_source=action_source,
    )

    status = "pending"
    meta_response: Optional[dict] = None
    try:
        meta_response = await _send_to_meta(pixel_id, access_token, payload)
        status = "sent"
        store_event_id(resolved_event_id)
        logger.info(
            f"✅ Meta CAPI {event_name} sent (event_id={resolved_event_id}, "
            f"events_received={meta_response.get('events_received', '?')})"
        )
    except HTTPException:
        status = "failed"
        raise
    finally:
        # 5. Log to Supabase regardless of outcome
        log_id = await _log_event(
            event_type=event_name,
            event_id=resolved_event_id,
            user_data=user_data_raw,
            custom_data=custom_data_raw,
            status=status,
            response=meta_response,
        )

    return TrackingEventResponse(
        success=True,
        event_id=resolved_event_id,
        platform="meta",
        event_type=event_name,
        message=f"Meta CAPI {event_name} event sent successfully",
        log_id=log_id,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/purchase", response_model=TrackingEventResponse)
async def meta_purchase(event: MetaPurchaseEvent, request: Request):
    """
    Send a Purchase event to Meta Conversions API.

    Triggered when a customer completes a payment. Sends value, currency,
    and hashed user data to Meta for conversion optimisation.

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/meta/purchase \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"email": "customer@example.com", "phone": "+31612345678"},
            "custom_data": {"value": 99.99, "currency": "EUR"},
            "content_name": "Knuffel Olifant"
          }'
    """
    logger.info(f"📥 Meta CAPI Purchase event received")
    return await _process_meta_event(
        event_name="Purchase",
        user_data_raw=event.user_data.model_dump(exclude_none=True),
        custom_data_raw=event.custom_data.model_dump(exclude_none=True),
        content_name=event.content_name,
        event_id=event.event_id,
        event_source_url=event.event_source_url,
        action_source=event.action_source or "website",
    )


@router.post("/add-to-cart", response_model=TrackingEventResponse)
async def meta_add_to_cart(event: MetaAddToCartEvent, request: Request):
    """
    Send an AddToCart event to Meta Conversions API.

    Triggered when a customer adds a product to their shopping cart.

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/meta/add-to-cart \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"email": "customer@example.com"},
            "custom_data": {"value": 29.99, "currency": "EUR", "content_ids": ["SKU-001"]},
            "content_name": "Knuffel Beer"
          }'
    """
    logger.info(f"📥 Meta CAPI AddToCart event received")
    return await _process_meta_event(
        event_name="AddToCart",
        user_data_raw=event.user_data.model_dump(exclude_none=True),
        custom_data_raw=event.custom_data.model_dump(exclude_none=True),
        content_name=event.content_name,
        event_id=event.event_id,
        event_source_url=event.event_source_url,
        action_source=event.action_source or "website",
    )


@router.post("/lead", response_model=TrackingEventResponse)
async def meta_lead(event: MetaLeadEvent, request: Request):
    """
    Send a Lead event to Meta Conversions API.

    Triggered when a customer submits a lead form or signs up for the
    newsletter.

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/meta/lead \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"email": "lead@example.com", "phone": "+31612345678"},
            "content_name": "Newsletter Signup"
          }'
    """
    logger.info(f"📥 Meta CAPI Lead event received")
    custom_data_raw = event.custom_data.model_dump(exclude_none=True) if event.custom_data else None
    return await _process_meta_event(
        event_name="Lead",
        user_data_raw=event.user_data.model_dump(exclude_none=True),
        custom_data_raw=custom_data_raw,
        content_name=event.content_name,
        event_id=event.event_id,
        event_source_url=event.event_source_url,
        action_source=event.action_source or "website",
    )


@router.post("/view-content", response_model=TrackingEventResponse)
async def meta_view_content(event: MetaViewContentEvent, request: Request):
    """
    Send a ViewContent event to Meta Conversions API.

    Triggered when a customer views a product detail page.

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/meta/view-content \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"client_ip_address": "1.2.3.4", "client_user_agent": "Mozilla/5.0"},
            "custom_data": {"content_ids": ["SKU-001"], "value": 29.99, "currency": "EUR"},
            "content_name": "Knuffel Giraf"
          }'
    """
    logger.info(f"📥 Meta CAPI ViewContent event received")
    custom_data_raw = event.custom_data.model_dump(exclude_none=True) if event.custom_data else None
    return await _process_meta_event(
        event_name="ViewContent",
        user_data_raw=event.user_data.model_dump(exclude_none=True),
        custom_data_raw=custom_data_raw,
        content_name=event.content_name,
        event_id=event.event_id,
        event_source_url=event.event_source_url,
        action_source=event.action_source or "website",
    )
