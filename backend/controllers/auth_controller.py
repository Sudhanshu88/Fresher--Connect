from __future__ import annotations

from flask import jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from backend.models.documents import build_company_document, build_user_document
from backend.services.platform_service import (
    get_store,
    json_error,
    normalize_email,
    parse_optional_int,
    parse_skills,
    serialize_user,
    utcnow,
)


def _start_session(account_id, role):
    session["account_id"] = account_id
    session["user_id"] = account_id
    session["user_role"] = role
    session.permanent = True


def register_account():
    store = get_store()
    payload = request.get_json(silent=True) or {}
    role = str(payload.get("role") or "fresher").strip().lower()
    name = str(payload.get("name") or "").strip()
    email = normalize_email(payload.get("email"))
    password = str(payload.get("password") or "")

    if role not in {"fresher", "company"}:
        return json_error("invalid_role", 400)
    if not name:
        return json_error("name_required", 400)
    if not email:
        return json_error("email_required", 400)
    if len(password) < 8:
        return json_error("password_too_short", 400)
    if store.find_account_by_email(email):
        return json_error("email_already_registered", 409)

    now = utcnow()
    if role == "company":
        company_name = str(payload.get("company_name") or "").strip()
        if not company_name:
            return json_error("company_name_required", 400)

        company = build_company_document(
            company_id=store.next_sequence("companies"),
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
            company_name=company_name,
            company_logo=str(payload.get("company_logo") or "").strip(),
            company_website=str(payload.get("company_website") or "").strip(),
            industry_type=str(payload.get("industry_type") or "").strip(),
            company_size=str(payload.get("company_size") or "").strip(),
            company_description=str(payload.get("company_description") or "").strip(),
            location=str(payload.get("location") or "").strip(),
            created_at=now,
        )
        store.companies.insert_one(company)
        _start_session(company["company_id"], "company")
        return jsonify({"ok": True, "user": serialize_user(company)})

    grad_year = parse_optional_int(payload.get("grad_year"))
    education = str(payload.get("education") or "").strip()
    if grad_year is None:
        return json_error("grad_year_required", 400)
    if not education:
        return json_error("education_required", 400)

    user = build_user_document(
        user_id=store.next_sequence("users"),
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        phone=str(payload.get("phone") or "").strip(),
        location=str(payload.get("location") or "").strip(),
        education=education,
        grad_year=grad_year,
        skills=parse_skills(payload.get("skills")),
        summary=str(payload.get("summary") or "").strip(),
        resume_path=str(payload.get("resume_path") or "").strip(),
        created_at=now,
    )
    store.users.insert_one(user)
    _start_session(user["user_id"], "fresher")
    return jsonify({"ok": True, "user": serialize_user(user)})


def login_account():
    store = get_store()
    payload = request.get_json(silent=True) or {}
    email = normalize_email(payload.get("email"))
    password = str(payload.get("password") or "")
    if not email or not password:
        return json_error("email_and_password_required", 400)

    account = store.find_account_by_email(email)
    if not account or not check_password_hash(account.get("password_hash", ""), password):
        return json_error("invalid_credentials", 401)

    role = account.get("role", "fresher")
    account_id = account.get("company_id") if role == "company" else account.get("user_id")
    _start_session(account_id, role)
    return jsonify({"ok": True, "user": serialize_user(account)})


def logout_account():
    session.clear()
    return jsonify({"ok": True})
