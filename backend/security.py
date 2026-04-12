from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
import os
import time
from collections import defaultdict

# API Key validation
VALID_API_KEYS = os.environ.get('API_KEYS', '').split(',') if os.environ.get('API_KEYS') else []


def validate_api_key(api_key: str) -> bool:
    """Validate API key against the list loaded from environment"""
    if not VALID_API_KEYS:
        return False
    return api_key in VALID_API_KEYS


# Rate limiting
class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)

    def is_allowed(self, client_id: str) -> bool:
        """Check if client is within rate limit"""
        now = time.time()
        minute_ago = now - 60

        # Clean old requests
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > minute_ago
        ]

        # Check limit
        if len(self.requests[client_id]) >= self.requests_per_minute:
            return False

        self.requests[client_id].append(now)
        return True


rate_limiter = RateLimiter(requests_per_minute=100)

# Security headers added to every response
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
}

# CORS configuration
CORS_CONFIG = {
    "allow_origins": os.environ.get('CORS_ORIGINS', 'https://droomvriendjes.nl').split(','),
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["*"],
}
