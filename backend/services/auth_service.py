from __future__ import annotations

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from flask import current_app
from werkzeug.security import check_password_hash


def hash_password(password):
    rounds = int(current_app.config.get("BCRYPT_LOG_ROUNDS", 12))
    encoded = str(password).encode("utf-8")
    return bcrypt.hashpw(encoded, bcrypt.gensalt(rounds=rounds)).decode("utf-8")


def verify_password(password, password_hash):
    encoded_password = str(password).encode("utf-8")
    encoded_hash = str(password_hash or "").encode("utf-8")

    if str(password_hash or "").startswith("$2"):
        try:
            return bcrypt.checkpw(encoded_password, encoded_hash)
        except ValueError:
            return False

    return check_password_hash(str(password_hash or ""), str(password))


def issue_access_token(*, subject, auth_role, db_role):
    now = datetime.now(UTC)
    expires_at = now + timedelta(hours=int(current_app.config.get("JWT_EXPIRATION_HOURS", 12)))
    payload = {
        "sub": str(subject),
        "role": auth_role,
        "db_role": db_role,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(
        payload,
        current_app.config["JWT_SECRET_KEY"],
        algorithm=current_app.config["JWT_ALGORITHM"],
    )
    return {
        "access_token": token,
        "token_type": "Bearer",
        "expires_at": expires_at.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    }


def decode_access_token(token):
    try:
        payload = jwt.decode(
            token,
            current_app.config["JWT_SECRET_KEY"],
            algorithms=[current_app.config["JWT_ALGORITHM"]],
        )
    except jwt.InvalidTokenError:
        return None
    return payload
