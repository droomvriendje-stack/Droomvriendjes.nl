"""
Admin Authentication API Routes

Provides simple dev/test JWT-based authentication for the admin panel.
Endpoints:
  GET  /admin/dev-login?u=<username>&p=<password>  — issue a JWT token
  GET  /admin/verify                               — validate a Bearer token
"""

import os
import logging
from datetime import datetime, timezone, timedelta

import jwt
from fastapi import APIRouter, HTTPException, Header, Query, status

logger = logging.getLogger(__name__)

# Secret key — override via ADMIN_JWT_SECRET env var in production
JWT_SECRET = os.environ.get("ADMIN_JWT_SECRET", "droomvriendjes-admin-dev-secret-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

# Hardcoded dev/test admin credentials
# Override via ADMIN_USERNAME / ADMIN_PASSWORD environment variables
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin")

router = APIRouter(prefix="/admin", tags=["admin"])


def _create_token(username: str) -> str:
    """Create a signed JWT for the given admin username."""
    payload = {
        "sub": username,
        "role": "admin",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises HTTPException on failure."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is verlopen",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ongeldig token",
        )


@router.get("/dev-login")
async def dev_login(
    u: str = Query(..., description="Admin username"),
    p: str = Query(..., description="Admin password"),
):
    """
    Issue a JWT token for valid admin credentials.

    Usage: GET /api/admin/dev-login?u=admin&p=admin
    """
    if u != ADMIN_USERNAME or p != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ongeldige gebruikersnaam of wachtwoord",
        )

    token = _create_token(u)
    logger.info(f"Admin login successful for user: {u}")

    return {
        "token": token,
        "admin": {
            "username": u,
            "role": "admin",
        },
    }


@router.get("/verify")
async def verify_token(authorization: str = Header(None)):
    """
    Validate a Bearer JWT token and return the admin user info.

    Usage: GET /api/admin/verify
           Authorization: Bearer <token>
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geen geldig Authorization header",
        )

    token = authorization.removeprefix("Bearer ").strip()
    payload = _decode_token(token)

    username = payload.get("sub", "admin")
    logger.info(f"Admin token verified for user: {username}")

    return {
        "admin": {
            "username": username,
            "role": payload.get("role", "admin"),
        },
    }
