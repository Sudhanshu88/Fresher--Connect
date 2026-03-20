from __future__ import annotations

from flask import jsonify, request, session

from backend.models.documents import build_candidate_profile_document, build_company_document, build_user_document
from backend.services.auth_service import hash_password, issue_access_token, verify_password
from backend.services.platform_service import (
    get_store,
    json_error,
    normalize_email,
    parse_optional_int,
    parse_skills,
    serialize_user,
    utcnow,
)
from backend.services.workflow_service import normalize_company_verification_status


def _auth_response(user, *, subject_id, auth_role, db_role, status_code=200):
    payload = issue_access_token(subject=subject_id, auth_role=auth_role, db_role=db_role)
    response = {"ok": True, "user": user, **payload}
    return jsonify(response), status_code


def _session_role_for(stored_role):
    if stored_role == "company":
        return "company"
    if stored_role == "candidate":
        return "fresher"
    return "admin"


def _company_login_error(store, account_id):
    company = store.get_account("company", account_id) or {}
    verification_status = normalize_company_verification_status(company.get("verification_status"), default="pending")
    if verification_status == "verified":
        return None
    return "company_verification_rejected" if verification_status == "rejected" else "company_verification_pending"


def _login_success_response(store, account, *, admin_only=False):
    stored_role = str(account.get("role") or "candidate").strip().lower()
    if account.get("is_active") is False:
        return json_error("account_disabled", 403)
    if admin_only:
        if stored_role != "admin":
            return json_error("admin_access_required", 403)
    elif stored_role == "admin":
        return json_error("admin_login_required", 403)

    if stored_role == "company":
        error_code = _company_login_error(store, account["id"])
        if error_code:
            return json_error(error_code, 403)

    session_role = _session_role_for(stored_role)
    return _auth_response(
        serialize_user(store.get_account(session_role, account["id"])),
        subject_id=account["id"],
        auth_role=session_role,
        db_role=stored_role,
    )


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

        user = build_user_document(
            user_id=store.next_sequence("users"),
            name=name,
            email=email,
            password_hash=hash_password(password),
            role="company",
            created_at=now,
        )
        company = build_company_document(
            company_id=store.next_sequence("companies"),
            owner_user_id=user["id"],
            company_name=company_name,
            website=str(payload.get("company_website") or payload.get("website") or "").strip(),
            location=str(payload.get("location") or "").strip(),
            description=str(payload.get("company_description") or payload.get("description") or "").strip(),
            company_logo=str(payload.get("company_logo") or "").strip(),
            industry_type=str(payload.get("industry_type") or "").strip(),
            company_size=str(payload.get("company_size") or "").strip(),
            created_at=now,
            verification_status="pending",
            verification_updated_at=now,
        )
        store.users.insert_one(user)
        store.companies.insert_one(company)
        return (
            jsonify(
                {
                    "ok": True,
                    "user": serialize_user(store.get_account("company", user["id"])),
                    "requires_approval": True,
                    "approval_status": "pending",
                    "message": "Company account created and sent for admin verification.",
                }
            ),
            201,
        )

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
        password_hash=hash_password(password),
        role="candidate",
        created_at=now,
    )
    profile = build_candidate_profile_document(
        user_id=user["id"],
        skills=parse_skills(payload.get("skills")),
        education=education,
        experience=str(payload.get("experience") or "fresher").strip(),
        profile_photo=str(payload.get("profile_photo") or payload.get("photo_url") or "").strip(),
        resume_url=str(payload.get("resume_url") or payload.get("resume_path") or "").strip(),
        linkedin=str(payload.get("linkedin") or "").strip(),
        portfolio=str(payload.get("portfolio") or "").strip(),
        location=str(payload.get("location") or "").strip(),
        phone=str(payload.get("phone") or "").strip(),
        summary=str(payload.get("summary") or "").strip(),
        grad_year=grad_year,
        created_at=now,
    )
    store.users.insert_one(user)
    store.candidate_profiles.insert_one(profile)
    return _auth_response(
        serialize_user(store.get_account("fresher", user["id"])),
        subject_id=user["id"],
        auth_role="fresher",
        db_role="candidate",
        status_code=201,
    )


def login_account():
    store = get_store()
    payload = request.get_json(silent=True) or {}
    email = normalize_email(payload.get("email"))
    password = str(payload.get("password") or "")
    if not email or not password:
        return json_error("email_and_password_required", 400)

    account = store.find_account_by_email(email)
    if not account or not verify_password(password, account.get("password_hash", "")):
        return json_error("invalid_credentials", 401)

    return _login_success_response(store, account, admin_only=False)

def login_admin_account():
    store = get_store()
    payload = request.get_json(silent=True) or {}
    email = normalize_email(payload.get("email"))
    password = str(payload.get("password") or "")
    if not email or not password:
        return json_error("email_and_password_required", 400)

    account = store.find_account_by_email(email)
    if not account or not verify_password(password, account.get("password_hash", "")):
        return json_error("invalid_credentials", 401)

    return _login_success_response(store, account, admin_only=True)


def logout_account():
    session.clear()
    return jsonify({"ok": True})
