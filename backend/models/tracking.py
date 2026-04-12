"""
Pydantic Models for Server-Side Tracking

Defines request/response schemas for Meta Conversions API (CAPI) and
TikTok Events API endpoints.  All PII fields are optional so callers
can supply as much or as little user data as they have available —
more data improves Event Match Quality scores.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re


# ---------------------------------------------------------------------------
# Shared sub-models
# ---------------------------------------------------------------------------

class UserData(BaseModel):
    """
    User identification data used by both Meta and TikTok.

    All fields are optional; supply as many as possible to maximise
    Event Match Quality.  PII fields are hashed server-side before
    transmission.
    """
    email: Optional[str] = Field(None, description="Customer email address")
    phone: Optional[str] = Field(None, description="Customer phone number (any format)")
    first_name: Optional[str] = Field(None, description="Customer first name")
    last_name: Optional[str] = Field(None, description="Customer last name")
    city: Optional[str] = Field(None, description="Customer city")
    state: Optional[str] = Field(None, description="Customer state / province")
    zip: Optional[str] = Field(None, description="Customer postal / zip code")
    country: Optional[str] = Field(None, description="ISO 3166-1 alpha-2 country code, e.g. 'NL'")
    date_of_birth: Optional[str] = Field(None, description="Date of birth YYYYMMDD")
    gender: Optional[str] = Field(None, description="'m' or 'f'")
    external_id: Optional[str] = Field(None, description="Your internal customer ID")
    client_ip_address: Optional[str] = Field(None, description="Customer IP address")
    client_user_agent: Optional[str] = Field(None, description="Customer browser user-agent")
    # Meta-specific click/browser IDs
    fbc: Optional[str] = Field(None, description="Facebook click ID (_fbc cookie)")
    fbp: Optional[str] = Field(None, description="Facebook browser ID (_fbp cookie)")


class CustomData(BaseModel):
    """
    Event-specific data for purchase / add-to-cart events.
    """
    value: Optional[float] = Field(None, description="Monetary value of the event")
    currency: Optional[str] = Field("EUR", description="ISO 4217 currency code")
    content_ids: Optional[list[str]] = Field(None, description="List of product IDs")
    content_type: Optional[str] = Field("product", description="'product' or 'product_group'")
    num_items: Optional[int] = Field(None, description="Number of items in the cart/order")
    order_id: Optional[str] = Field(None, description="Your internal order ID")


# ---------------------------------------------------------------------------
# Meta CAPI models
# ---------------------------------------------------------------------------

class MetaPurchaseEvent(BaseModel):
    """
    Schema for POST /api/tracking/meta/purchase

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/meta/purchase \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"email": "customer@example.com", "phone": "+31612345678"},
            "custom_data": {"value": 99.99, "currency": "EUR"},
            "content_name": "Knuffel Olifant"
          }'
    """
    user_data: UserData = Field(..., description="Customer identification data")
    custom_data: CustomData = Field(..., description="Purchase-specific data")
    content_name: Optional[str] = Field(None, description="Product or content name")
    event_id: Optional[str] = Field(None, description="Unique event ID for deduplication")
    event_source_url: Optional[str] = Field(None, description="URL where the event occurred")
    action_source: Optional[str] = Field("website", description="Where the event happened")


class MetaAddToCartEvent(BaseModel):
    """
    Schema for POST /api/tracking/meta/add-to-cart

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/meta/add-to-cart \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"email": "customer@example.com"},
            "custom_data": {"value": 29.99, "currency": "EUR", "content_ids": ["SKU-001"]},
            "content_name": "Knuffel Beer"
          }'
    """
    user_data: UserData = Field(..., description="Customer identification data")
    custom_data: CustomData = Field(..., description="Cart-specific data")
    content_name: Optional[str] = Field(None, description="Product or content name")
    event_id: Optional[str] = Field(None, description="Unique event ID for deduplication")
    event_source_url: Optional[str] = Field(None, description="URL where the event occurred")
    action_source: Optional[str] = Field("website", description="Where the event happened")


class MetaLeadEvent(BaseModel):
    """
    Schema for POST /api/tracking/meta/lead

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/meta/lead \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"email": "lead@example.com", "phone": "+31612345678"},
            "content_name": "Newsletter Signup"
          }'
    """
    user_data: UserData = Field(..., description="Customer identification data")
    content_name: Optional[str] = Field(None, description="Lead source or form name")
    event_id: Optional[str] = Field(None, description="Unique event ID for deduplication")
    event_source_url: Optional[str] = Field(None, description="URL where the event occurred")
    action_source: Optional[str] = Field("website", description="Where the event happened")
    custom_data: Optional[CustomData] = Field(None, description="Optional additional data")


class MetaViewContentEvent(BaseModel):
    """
    Schema for POST /api/tracking/meta/view-content

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/meta/view-content \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"client_ip_address": "1.2.3.4", "client_user_agent": "Mozilla/5.0"},
            "custom_data": {"content_ids": ["SKU-001"], "value": 29.99, "currency": "EUR"},
            "content_name": "Knuffel Giraf"
          }'
    """
    user_data: UserData = Field(..., description="Customer identification data")
    content_name: Optional[str] = Field(None, description="Product or page name")
    event_id: Optional[str] = Field(None, description="Unique event ID for deduplication")
    event_source_url: Optional[str] = Field(None, description="URL where the event occurred")
    action_source: Optional[str] = Field("website", description="Where the event happened")
    custom_data: Optional[CustomData] = Field(None, description="Optional content data")


# ---------------------------------------------------------------------------
# TikTok Events API models
# ---------------------------------------------------------------------------

class TikTokUserData(BaseModel):
    """
    User identification data for TikTok Events API.

    TikTok uses different field names from Meta but the same SHA-256
    hashing requirement applies.
    """
    email: Optional[str] = Field(None, description="Customer email address")
    phone: Optional[str] = Field(None, description="Customer phone number (any format)")
    external_id: Optional[str] = Field(None, description="Your internal customer ID")
    client_ip_address: Optional[str] = Field(None, description="Customer IP address")
    client_user_agent: Optional[str] = Field(None, description="Customer browser user-agent")
    # TikTok-specific identifiers
    ttclid: Optional[str] = Field(None, description="TikTok click ID from URL parameter")
    ttp: Optional[str] = Field(None, description="TikTok pixel cookie (_ttp)")


class TikTokProperties(BaseModel):
    """
    Event properties for TikTok Events API.
    """
    value: Optional[float] = Field(None, description="Monetary value of the event")
    currency: Optional[str] = Field("EUR", description="ISO 4217 currency code")
    content_id: Optional[str] = Field(None, description="Product ID")
    content_name: Optional[str] = Field(None, description="Product or content name")
    content_type: Optional[str] = Field("product", description="Content type")
    quantity: Optional[int] = Field(None, description="Number of items")
    order_id: Optional[str] = Field(None, description="Your internal order ID")


class TikTokPurchaseEvent(BaseModel):
    """
    Schema for POST /api/tracking/tiktok/purchase

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/tiktok/purchase \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"email": "customer@example.com", "phone": "+31612345678"},
            "properties": {"value": 99.99, "currency": "EUR", "content_id": "SKU-001", "content_name": "Knuffel Olifant"}
          }'
    """
    user_data: TikTokUserData = Field(..., description="Customer identification data")
    properties: TikTokProperties = Field(..., description="Purchase-specific properties")
    event_id: Optional[str] = Field(None, description="Unique event ID for deduplication")
    event_source_url: Optional[str] = Field(None, description="URL where the event occurred")


class TikTokAddToCartEvent(BaseModel):
    """
    Schema for POST /api/tracking/tiktok/add-to-cart

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/tiktok/add-to-cart \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"email": "customer@example.com"},
            "properties": {"value": 29.99, "currency": "EUR", "content_id": "SKU-001", "content_name": "Knuffel Beer"}
          }'
    """
    user_data: TikTokUserData = Field(..., description="Customer identification data")
    properties: TikTokProperties = Field(..., description="Cart-specific properties")
    event_id: Optional[str] = Field(None, description="Unique event ID for deduplication")
    event_source_url: Optional[str] = Field(None, description="URL where the event occurred")


class TikTokViewContentEvent(BaseModel):
    """
    Schema for POST /api/tracking/tiktok/view-content

    Example curl:
        curl -X POST http://localhost:8000/api/tracking/tiktok/view-content \\
          -H "Content-Type: application/json" \\
          -d '{
            "user_data": {"client_ip_address": "1.2.3.4", "client_user_agent": "Mozilla/5.0"},
            "properties": {"content_id": "SKU-001", "content_name": "Knuffel Giraf", "value": 29.99, "currency": "EUR"}
          }'
    """
    user_data: TikTokUserData = Field(..., description="Customer identification data")
    properties: TikTokProperties = Field(..., description="Content-specific properties")
    event_id: Optional[str] = Field(None, description="Unique event ID for deduplication")
    event_source_url: Optional[str] = Field(None, description="URL where the event occurred")


# ---------------------------------------------------------------------------
# Shared response model
# ---------------------------------------------------------------------------

class TrackingEventResponse(BaseModel):
    """Standard response returned by all tracking endpoints."""
    success: bool
    event_id: str
    platform: str
    event_type: str
    message: str
    log_id: Optional[str] = None
