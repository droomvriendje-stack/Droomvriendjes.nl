"""
TikTok Events API — Server-Side Tracking Routes

Sends conversion events directly from the backend to TikTok's Events API,
bypassing browser-based pixel restrictions (ad blockers, iOS 14.5+ ATT).

Endpoints:
    POST /api/tracking/tiktok/purchase       — Purchase event
    POST /api/tracking/tiktok/add-to-cart    — AddToCart event
    POST /api/tracking/tiktok/view-content   — ViewContent event

Environment variables required:
    TIKTOK_ACCESS_TOKEN  — Access token from TikTok Events Manager
    TIKTOK_BUSINESS_ID   — Your TikTok Pixel / Business ID

All PII is hashed with SHA-256 before transmission.
Events are logged to the Supabase `tracking_events` table for audit trail.

TikTok Events API docs: https://business-api.tiktok.com/portal/docs?id=1741601162187777
"""
import os
import uuid
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Request

from backend.models.tracking import (
    TikTokPurchaseEvent,
    TikTokAddToCartEvent,
    TikTokViewContentEvent,
    TrackingEventResponse,
)
from backend.utils.tracking_hashing import hash_pii, normalize_email, normalize_phone
from backend.utils.tracking_deduplication import check_duplicate_event, store_event_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tracking/tiktok", tags=["tracking-tiktok"])

# ---------------------------------------------------------------------------
# Module-level state (injected by server.py)
# ---------------------------------------------------------------------------
supabase = None


def set_supabase_client(client) -> None:
    """Inject the Supabase client from the main application."""
    global supabase
    supabase = client
    logger.info("✅ Supabase client set for TikTok Events tracking route")


# ---------------------------------------------------------------------------
# TikTok Events API configuration
# ---------------------------------------------------------------------------
TIKTOK_EVENTS_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/"
_MAX_RETRIES = 3
_RETRY_BACKOFF_BASE = 1.0  # seconds


def _get_tiktok_config() -> tuple[str, str]:
    """Return (access_token, pixel_id) from environment, raising if missing."""
    token = os.environ.get("TIKTOK_ACCESS_TOKEN", "")
    pixel_id = os.environ.get("TIKTOK_BUSINESS_ID", "")
    if not token:
        raise HTTPException(
            status_code=503,
            detail="TIKTOK_ACCESS_TOKEN is not configured on this server.",
        )
    if not pixel_id:
        raise HTTPException(
            status_code=503,
            detail="TIKTOK_BUSINESS_ID is not configured on this server.",
        )
    return token, pixel_id


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _hash_tiktok_user_data(raw: dict) -> dict:
    """
    Normalize and hash user data fields for TikTok Events API.

    TikTok uses a flat structure with SHA-256 hashed PII values.
    Non-PII fields (IP, user agent, ttclid, ttp) are passed through.
    """
    hashed: dict = {}

    if raw.get("email"):
        hashed["email"] = hash_pii(normalize_email(raw["email"]))

    if raw.get("phone"):
        hashed["phone_number"] = hash_pii(normalize_phone(raw["phone"]))

    if raw.get("external_id"):
        hashed["external_id"] = hash_pii(raw["external_id"])

    # Non-PII passthrough fields
    for key in ("client_ip_address", "client_user_agent", "ttclid", "ttp"):
        if raw.get(key):
            hashed[key] = raw[key]

    return hashed


async def _send_to_tiktok(
    access_token: str,
    payload: dict,
) -> dict:
    """
    POST the event payload to TikTok Events API with exponential-backoff retry.

    Args:
        access_token: TikTok access token.
        payload:      Full Events API request body (dict).

    Returns:
        Parsed JSON response from TikTok.

    Raises:
        HTTPException: If all retries are exhausted.
    """
    headers = {
        "Access-Token": access_token,
        "Content-Type": "application/json",
    }

    last_exc: Optional[Exception] = None
    for attempt in range(_MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    TIKTOK_EVENTS_URL, headers=headers, json=payload
                )
                response.raise_for_status()
                data = response.json()
                # TikTok returns code 0 for success
                if data.get("code") not in (0, None):
                    logger.warning(
                        f"TikTok Events API non-zero code: {data.get('code')} — {data.get('message')}"
                    )
                return data
        except httpx.HTTPStatusError as exc:
            logger.warning(
                f"TikTok Events API HTTP error (attempt {attempt + 1}/{_MAX_RETRIES}): "
                f"{exc.response.status_code} — {exc.response.text}"
            )
            last_exc = exc
            if exc.response.status_code < 500:
                raise HTTPException(
                    status_code=exc.response.status_code,
                    detail=f"TikTok Events API rejected the request: {exc.response.text}",
                )
        except Exception as exc:
            logger.warning(
                f"TikTok Events API request error (attempt {attempt + 1}/{_MAX_RETRIES}): {exc}"
            )
            last_exc = exc

        if attempt < _MAX_RETRIES - 1:
            await asyncio.sleep(_RETRY_BACKOFF_BASE * (2 ** attempt))

    raise HTTPException(
        status_code=502,
        detail=f"TikTok Events API unreachable after {_MAX_RETRIES} attempts: {last_exc}",
    )


async def _log_event(
    event_type: str,
    event_id: str,
    user_data: dict,
    properties: Optional[dict],
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
            "platform": "tiktok",
            "event_id": event_id,
            "user_data": user_data,
            "custom_data": properties,
            "status": status,
            "response": response,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        supabase.table("tracking_events").insert(record).execute()
        logger.info(f"📊 TikTok event logged: {event_type} (log_id={log_id})")
        return log_id
    except Exception as exc:
        logger.error(f"Failed to log TikTok event to Supabase: {exc}")
        return None


def _build_tiktok_payload(
    pixel_id: str,
    event_name: str,
    event_id: str,
    hashed_user: dict,
    properties: Optional[dict],
    event_source_url: Optional[str],
) -> dict:
    """Construct the TikTok Events API request body."""
    event_time = int(datetime.now(timezone.utc).timestamp())

    event: dict = {
        "event": event_name,
        "event_time": event_time,
        "event_id": event_id,
        "user": hashed_user,
    }

    if event_source_url:
        event["page"] = {"url": event_source_url}

    if properties:
        built_props: dict = {}
        if properties.get("value") is not None:
            built_props["value"] = properties["value"]
        if properties.get("currency"):
            built_props["currency"] = properties["currency"]
        if properties.get("content_id"):
            built_props["content_id"] = properties["content_id"]
        if properties.get("content_name"):
            built_props["content_name"] = properties["content_name"]
        if properties.get("content_type"):
            built_props["content_type"] = properties["content_type"]
        if properties.get("quantity") is not None:
            built_props["quantity"] = properties["quantity"]
        if properties.get("order_id"):
            built_props["order_id"] = properties["order_id"]
        if built_props:
            event["properties"] = built_props

    return {
        "pixel_code": pixel_id,
        "event_source": "web",
        "data": [event],
    }


async def _process_tiktok_event(
    event_name: str,
    user_data_raw: dict,
    properties_raw: Optional[dict],
    event_id: Optional[str],
    event_source_url: Optional[str],
) -> TrackingEventResponse:
    """
    Core logic shared by all TikTok Events API endpoint handlers.

    1. Resolve / generate event_id
    2. Check for duplicates
    3. Hash PII
    4. Build and send Events API payload
    5. Log to Supabase
    """
    # 1. Resolve event_id
    resolved_event_id = event_id or str(uuid.uuid4())

    # 2. Deduplication check
    if check_duplicate_event(resolved_event_id):
        logger.info(
            f"⚠️ Duplicate TikTok event skipped: {event_name} (event_id={resolved_event_id})"
        )
        return TrackingEventResponse(
            success=True,
            event_id=resolved_event_id,
            platform="tiktok",
            event_type=event_name,
            message="Duplicate event skipped",
        )

    # 3. Hash PII
    hashed_user = _hash_tiktok_user_data(user_data_raw)

    # 4. Build payload and send
    access_token, pixel_id = _get_tiktok_config()
    payload = _build_tiktok_payload(
        pixel_id=pixel_id,
        event_name=event_name,
        event_id=resolved_event_id,
        hashed_user=hashed_user,
        properties=properties_raw,
        event_source_url=event_source_url,
    )

    status = "pending"
    tiktok_response: Optional[dict] = None
    try:
        tiktok_response = await _send_to_tiktok(access_token, payload)
        status = "sent"
        store_event_id(resolved_event_id)
        logger.info(
            f"✅ TikTok {event_name} sent (event_id={resolved_event_id}, "
            f"code={tiktok_response.get('code', '?')})"
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
            properties=properties_raw,
            status=status,
            response=tiktok_response,
        )

    return TrackingEventResponse(
        success=True,
        event_id=resolved_event_id,
        platform="tiktok",
        event_type=event_name,
        message=f"TikTok {event_name} event sent successfully",
        log_id=log_id,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/purchase", response_model=TrackingEventResponse)
async def tiktok_purchase(event: TikTokPurchaseEvent, request: Request):
    """
    Send a Purchase event to TikTok Events API.

    Triggered when a customer completes a payment.

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/tiktok/purchase \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"email": "customer@example.com", "phone": "+31612345678"},
            "properties": {"value": 99.99, "currency": "EUR", "content_id": "SKU-001", "content_name": "Knuffel Olifant"}
          }'
    """
    logger.info("📥 TikTok Purchase event received")
    return await _process_tiktok_event(
        event_name="PlaceAnOrder",
        user_data_raw=event.user_data.model_dump(exclude_none=True),
        properties_raw=event.properties.model_dump(exclude_none=True),
        event_id=event.event_id,
        event_source_url=event.event_source_url,
    )


@router.post("/add-to-cart", response_model=TrackingEventResponse)
async def tiktok_add_to_cart(event: TikTokAddToCartEvent, request: Request):
    """
    Send an AddToCart event to TikTok Events API.

    Triggered when a customer adds a product to their shopping cart.

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/tiktok/add-to-cart \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"email": "customer@example.com"},
            "properties": {"value": 29.99, "currency": "EUR", "content_id": "SKU-001", "content_name": "Knuffel Beer"}
          }'
    """
    logger.info("📥 TikTok AddToCart event received")
    return await _process_tiktok_event(
        event_name="AddToCart",
        user_data_raw=event.user_data.model_dump(exclude_none=True),
        properties_raw=event.properties.model_dump(exclude_none=True),
        event_id=event.event_id,
        event_source_url=event.event_source_url,
    )


@router.post("/view-content", response_model=TrackingEventResponse)
async def tiktok_view_content(event: TikTokViewContentEvent, request: Request):
    """
    Send a ViewContent event to TikTok Events API.

    Triggered when a customer views a product detail page.

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/tiktok/view-content \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"client_ip_address": "1.2.3.4", "client_user_agent": "Mozilla/5.0"},
            "properties": {"content_id": "SKU-001", "content_name": "Knuffel Giraf", "value": 29.99, "currency": "EUR"}
          }'
    """
    logger.info("📥 TikTok ViewContent event received")
    return await _process_tiktok_event(
        event_name="ViewContent",
        user_data_raw=event.user_data.model_dump(exclude_none=True),
        properties_raw=event.properties.model_dump(exclude_none=True),
        event_id=event.event_id,
        event_source_url=event.event_source_url,
    )
