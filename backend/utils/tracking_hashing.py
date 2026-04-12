"""
PII Hashing Utilities for Server-Side Tracking

Provides SHA-256 hashing and normalization functions for user data
sent to Meta Conversions API and TikTok Events API.

All PII must be hashed before transmission to comply with platform
requirements and privacy regulations (GDPR, ePrivacy Directive).
"""
import hashlib
import re
import logging

logger = logging.getLogger(__name__)


def hash_pii(value: str) -> str:
    """
    Hash a PII value using SHA-256.

    Args:
        value: The raw PII string to hash (should already be normalized).

    Returns:
        Lowercase hex-encoded SHA-256 digest.

    Example:
        >>> hash_pii("customer@example.com")
        'b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514'
    """
    if not value:
        return ""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def normalize_email(email: str) -> str:
    """
    Normalize an email address: lowercase and strip whitespace.

    Args:
        email: Raw email address string.

    Returns:
        Normalized email string ready for hashing.

    Example:
        >>> normalize_email("  Customer@Example.COM  ")
        'customer@example.com'
    """
    if not email:
        return ""
    return email.strip().lower()


def normalize_phone(phone: str) -> str:
    """
    Normalize a phone number: strip all non-digit characters.

    Keeps only digits so that "+31 6 12 34 56 78" becomes "31612345678".
    Meta and TikTok expect E.164 format digits without the leading '+'.

    Args:
        phone: Raw phone number string (any format).

    Returns:
        Digits-only string ready for hashing.

    Example:
        >>> normalize_phone("+31 6 12-34-56-78")
        '31612345678'
    """
    if not phone:
        return ""
    return re.sub(r"\D", "", phone)


def normalize_address(address: str) -> str:
    """
    Normalize an address field: lowercase and strip whitespace.

    Used for city, state, zip, and country fields.

    Args:
        address: Raw address component string.

    Returns:
        Normalized lowercase string ready for hashing.

    Example:
        >>> normalize_address("  Amsterdam  ")
        'amsterdam'
    """
    if not address:
        return ""
    return address.strip().lower()


def normalize_name(name: str) -> str:
    """
    Normalize a name field: lowercase and strip whitespace.

    Args:
        name: Raw first or last name string.

    Returns:
        Normalized lowercase string ready for hashing.

    Example:
        >>> normalize_name("  Jan  ")
        'jan'
    """
    if not name:
        return ""
    return name.strip().lower()


def hash_user_data(raw: dict) -> dict:
    """
    Normalize and hash a dictionary of user data fields.

    Accepts raw user data and returns a dict with hashed values
    suitable for inclusion in Meta CAPI or TikTok Events API payloads.

    Supported keys:
        email, phone, first_name, last_name, city, state, zip, country,
        date_of_birth, gender, external_id, client_ip_address,
        client_user_agent, fbc, fbp

    Non-PII fields (ip, user_agent, fbc, fbp, external_id) are passed
    through without hashing.

    Args:
        raw: Dictionary of raw user data.

    Returns:
        Dictionary with normalized + hashed PII values.
    """
    hashed: dict = {}

    # Fields that require normalization + hashing
    if raw.get("email"):
        normalized = normalize_email(raw["email"])
        hashed["em"] = hash_pii(normalized)

    if raw.get("phone"):
        normalized = normalize_phone(raw["phone"])
        hashed["ph"] = hash_pii(normalized)

    if raw.get("first_name"):
        normalized = normalize_name(raw["first_name"])
        hashed["fn"] = hash_pii(normalized)

    if raw.get("last_name"):
        normalized = normalize_name(raw["last_name"])
        hashed["ln"] = hash_pii(normalized)

    if raw.get("city"):
        normalized = normalize_address(raw["city"])
        hashed["ct"] = hash_pii(normalized)

    if raw.get("state"):
        normalized = normalize_address(raw["state"])
        hashed["st"] = hash_pii(normalized)

    if raw.get("zip"):
        normalized = normalize_address(raw["zip"])
        hashed["zp"] = hash_pii(normalized)

    if raw.get("country"):
        normalized = normalize_address(raw["country"])
        hashed["country"] = hash_pii(normalized)

    if raw.get("date_of_birth"):
        normalized = normalize_address(raw["date_of_birth"])  # strip/lower
        hashed["db"] = hash_pii(normalized)

    if raw.get("gender"):
        normalized = raw["gender"].strip().lower()
        hashed["ge"] = hash_pii(normalized)

    # Non-PII passthrough fields
    for passthrough_key in (
        "client_ip_address",
        "client_user_agent",
        "fbc",
        "fbp",
        "external_id",
    ):
        if raw.get(passthrough_key):
            hashed[passthrough_key] = raw[passthrough_key]

    return hashed
