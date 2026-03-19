from __future__ import annotations

from functools import wraps

from flask import g, request, session

from backend.services.auth_service import decode_access_token
from backend.services.platform_service import get_store, json_error
from backend.services.workflow_service import normalize_company_verification_status


def extract_bearer_token(auth_header):
    value = str(auth_header or "").strip()
    if not value:
        return None
    prefix = "bearer "
    if value.lower().startswith(prefix):
        return value[len(prefix):].strip() or None
    return None


def current_account(store=None):
    cached = getattr(g, "fc_current_account", None)
    if cached is not None:
        return cached

    active_store = store or get_store()
    auth_role = None
    account_id = None

    token = extract_bearer_token(request.headers.get("Authorization"))
    if token:
        payload = decode_access_token(token)
        if payload:
            g.fc_token_payload = payload
            auth_role = payload.get("role")
            try:
                account_id = int(payload.get("sub"))
            except (TypeError, ValueError):
                account_id = None

    if auth_role is None or account_id is None:
        role = session.get("user_role")
        session_account_id = session.get("account_id")
        if session_account_id is None:
            session_account_id = session.get("user_id")
        if role in {"fresher", "company"} and session_account_id is not None:
            auth_role = role
            account_id = int(session_account_id)

    if auth_role not in {"fresher", "company", "admin"} or account_id is None:
        g.fc_current_account = None
        return None

    user = active_store.get_account(auth_role, account_id)
    g.fc_current_account = user
    return user


def company_access_error(user):
    if not user or user.get("role") != "company":
        return None
    verification_status = normalize_company_verification_status(user.get("verification_status"), default="pending")
    if verification_status == "verified":
        return None
    return "company_verification_rejected" if verification_status == "rejected" else "company_verification_pending"


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_account()
        if not user:
            return json_error("authentication_required", 401)
        if user.get("is_active") is False:
            return json_error("account_disabled", 403)
        error_code = company_access_error(user)
        if error_code:
            return json_error(error_code, 403)
        return fn(user, *args, **kwargs)

    return wrapper


def role_required(role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_account()
            if not user:
                return json_error("authentication_required", 401)
            if user.get("is_active") is False:
                return json_error("account_disabled", 403)
            if user.get("role") == "admin":
                return fn(user, *args, **kwargs)
            if role == "company":
                error_code = company_access_error(user)
                if error_code:
                    return json_error(error_code, 403)
            if user.get("role") != role:
                return json_error("forbidden", 403)
            return fn(user, *args, **kwargs)

        return wrapper

    return decorator
