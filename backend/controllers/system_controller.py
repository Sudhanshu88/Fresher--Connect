from __future__ import annotations

from flask import jsonify
from pymongo.errors import PyMongoError

from backend.middleware.auth import current_account
from backend.services.platform_service import get_store, serialize_user


def index():
    return jsonify(
        {
            "ok": True,
            "service": "fresher-connect-backend",
            "database": "mongodb",
            "frontend_hint": "Open http://127.0.0.1:3000/?api=http://127.0.0.1:5000",
        }
    )


def api_session():
    return jsonify(
        {
            "ok": True,
            "user": serialize_user(current_account()),
        }
    )


def healthcheck():
    store = get_store()
    try:
        store.bootstrap()
        store.ping()
        return jsonify({"ok": True, "database": "ready", "engine": "mongodb"})
    except (PyMongoError, RuntimeError):
        return jsonify({"ok": False, "database": "unavailable", "engine": "mongodb"}), 503
