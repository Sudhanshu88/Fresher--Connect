from __future__ import annotations

from functools import wraps

from flask import session

from backend.services.platform_service import get_store, json_error


def current_account(store=None):
    active_store = store or get_store()
    role = session.get("user_role")
    account_id = session.get("account_id")
    if account_id is None:
        account_id = session.get("user_id")
    if role not in {"fresher", "company"} or account_id is None:
        return None
    return active_store.get_account(role, int(account_id))


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_account()
        if not user:
            return json_error("authentication_required", 401)
        return fn(user, *args, **kwargs)

    return wrapper


def role_required(role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_account()
            if not user:
                return json_error("authentication_required", 401)
            if user.get("role") != role:
                return json_error("forbidden", 403)
            return fn(user, *args, **kwargs)

        return wrapper

    return decorator
