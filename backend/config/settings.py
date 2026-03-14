from __future__ import annotations

import os
from datetime import timedelta
from urllib.parse import urlparse

from dotenv import load_dotenv


load_dotenv()


def parse_bool(value, default=False):
    if value in (None, ""):
        return default
    if isinstance(value, bool):
        return value
    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "y", "on"}:
        return True
    if normalized in {"0", "false", "no", "n", "off"}:
        return False
    return default


def parse_optional_int(value):
    if value in (None, ""):
        return None
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def normalize_mongodb_uri():
    mongodb_uri = str(os.getenv("MONGODB_URI", "")).strip()
    if mongodb_uri:
        return mongodb_uri

    database_url = str(os.getenv("DATABASE_URL", "")).strip()
    if database_url.startswith("mongodb://") or database_url.startswith("mongodb+srv://"):
        return database_url

    return "mongodb://127.0.0.1:27017/fresher_connect"


def extract_database_name(uri):
    parsed = urlparse(uri)
    database_name = parsed.path.lstrip("/").split("/", 1)[0]
    return database_name or "fresher_connect"


def build_allowed_origins():
    origins = {"http://127.0.0.1:3000", "http://localhost:3000"}
    configured = str(os.getenv("FRONTEND_ORIGINS", "")).split(",")
    for origin in configured:
        origin = origin.strip()
        if origin:
            origins.add(origin)
    return origins


def is_allowed_origin(origin, allowed_origins):
    return bool(origin and origin in allowed_origins)


def load_runtime_settings():
    return {
        "SECRET_KEY": os.getenv("SECRET_KEY", "change-this-before-production"),
        "JWT_SECRET_KEY": os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "change-this-before-production")),
        "JWT_ALGORITHM": os.getenv("JWT_ALGORITHM", "HS256"),
        "JWT_EXPIRATION_HOURS": parse_optional_int(os.getenv("JWT_EXPIRATION_HOURS")) or 12,
        "BCRYPT_LOG_ROUNDS": parse_optional_int(os.getenv("BCRYPT_LOG_ROUNDS")) or 12,
        "SESSION_COOKIE_HTTPONLY": True,
        "SESSION_COOKIE_SAMESITE": "Lax",
        "SESSION_COOKIE_SECURE": parse_bool(os.getenv("SESSION_COOKIE_SECURE"), default=False),
        "MAX_CONTENT_LENGTH": parse_optional_int(os.getenv("MAX_CONTENT_LENGTH")) or 2 * 1024 * 1024,
        "PERMANENT_SESSION_LIFETIME": timedelta(days=7),
        "FC_ALLOWED_ORIGINS": build_allowed_origins(),
        "FC_MONGODB_URI": normalize_mongodb_uri(),
        "FC_USE_MOCK_DB": parse_bool(os.getenv("MONGODB_USE_MOCK"), default=False),
    }
