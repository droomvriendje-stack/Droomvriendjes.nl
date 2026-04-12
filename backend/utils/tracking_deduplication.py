"""
Event Deduplication Utility for Server-Side Tracking

Prevents duplicate conversion events from being sent to Meta CAPI and
TikTok Events API when the same event_id is received more than once
(e.g. from both browser pixel and server-side tracking).

Uses an in-memory TTL cache with a 24-hour expiry window. If Redis is
available via the REDIS_URL environment variable it will be used instead,
providing persistence across process restarts and multi-worker deployments.
"""
import time
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory cache (default)
# ---------------------------------------------------------------------------
# Structure: { event_id: expiry_timestamp_seconds }
_cache: dict[str, float] = {}

# TTL for event IDs: 24 hours in seconds
_TTL_SECONDS: int = 86_400

# ---------------------------------------------------------------------------
# Optional Redis backend
# ---------------------------------------------------------------------------
_redis_client = None

def _get_redis():
    """Lazily initialise a Redis client if REDIS_URL is configured."""
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    redis_url = os.environ.get("REDIS_URL", "")
    if not redis_url:
        return None

    try:
        import redis  # type: ignore
        _redis_client = redis.from_url(redis_url, decode_responses=True)
        _redis_client.ping()
        logger.info(f"✅ Redis connected for event deduplication: {redis_url}")
        return _redis_client
    except Exception as exc:
        logger.warning(
            f"⚠️ Redis unavailable ({exc}), falling back to in-memory deduplication cache"
        )
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def check_duplicate_event(event_id: str) -> bool:
    """
    Check whether an event_id has already been processed.

    Args:
        event_id: Unique identifier for the conversion event.

    Returns:
        True  – event was already processed (duplicate, skip it).
        False – event is new (process it).
    """
    if not event_id:
        return False

    redis = _get_redis()
    if redis is not None:
        try:
            return redis.exists(f"tracking:event:{event_id}") == 1
        except Exception as exc:
            logger.warning(f"Redis check_duplicate_event error: {exc}, falling back to memory")

    # In-memory fallback
    _evict_expired()
    return event_id in _cache


def store_event_id(event_id: str, ttl_seconds: Optional[int] = None) -> None:
    """
    Store an event_id so future calls to check_duplicate_event return True.

    Args:
        event_id:    Unique identifier for the conversion event.
        ttl_seconds: How long to remember the event (default: 24 hours).
    """
    if not event_id:
        return

    ttl = ttl_seconds if ttl_seconds is not None else _TTL_SECONDS

    redis = _get_redis()
    if redis is not None:
        try:
            redis.setex(f"tracking:event:{event_id}", ttl, "1")
            return
        except Exception as exc:
            logger.warning(f"Redis store_event_id error: {exc}, falling back to memory")

    # In-memory fallback
    _cache[event_id] = time.monotonic() + ttl
    _evict_expired()


def _evict_expired() -> None:
    """Remove expired entries from the in-memory cache."""
    now = time.monotonic()
    expired = [k for k, exp in _cache.items() if exp <= now]
    for k in expired:
        del _cache[k]
