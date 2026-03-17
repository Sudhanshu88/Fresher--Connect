from __future__ import annotations

from pymongo import DESCENDING

from backend.services.platform_service import isoformat, utcnow


def _actor_snapshot(actor=None, *, actor_role=None, actor_id=None, actor_name=None, actor_email=None):
    source = actor or {}
    resolved_role = str(actor_role or source.get("role") or "system").strip().lower() or "system"
    resolved_id = actor_id
    if resolved_id is None:
        resolved_id = source.get("user_id")
    if resolved_id is None:
        resolved_id = source.get("id")
    if resolved_id is None:
        resolved_id = source.get("company_id")

    return {
        "actor_id": resolved_id,
        "actor_role": resolved_role,
        "actor_name": actor_name or source.get("company_name") or source.get("name") or source.get("contact_name") or "System",
        "actor_email": actor_email or source.get("email"),
    }


def create_audit_event(
    store,
    *,
    action,
    actor=None,
    actor_role=None,
    actor_id=None,
    actor_name=None,
    actor_email=None,
    company_id=None,
    target_type=None,
    target_id=None,
    summary="",
    status="success",
    details=None,
):
    snapshot = _actor_snapshot(
        actor,
        actor_role=actor_role,
        actor_id=actor_id,
        actor_name=actor_name,
        actor_email=actor_email,
    )
    event = {
        "id": store.next_sequence("audit_logs"),
        "action": str(action or "").strip().lower(),
        "summary": str(summary or "").strip(),
        "status": str(status or "success").strip().lower(),
        "company_id": company_id,
        "target_type": str(target_type or "").strip().lower() or None,
        "target_id": target_id,
        "details": details or {},
        "created_at": utcnow(),
        **snapshot,
    }
    store.audit_logs.insert_one(event)
    return event


def serialize_audit_event(event):
    return {
        "id": event.get("id"),
        "action": event.get("action"),
        "summary": event.get("summary"),
        "status": event.get("status") or "success",
        "company_id": event.get("company_id"),
        "target_type": event.get("target_type"),
        "target_id": event.get("target_id"),
        "actor_id": event.get("actor_id"),
        "actor_role": event.get("actor_role") or "system",
        "actor_name": event.get("actor_name") or "System",
        "actor_email": event.get("actor_email"),
        "details": event.get("details") or {},
        "created_at": isoformat(event.get("created_at")),
    }


def list_recent_audit_events(store, *, company_id=None, limit=12):
    query = {}
    if company_id is not None:
        query["company_id"] = int(company_id)
    return [
        serialize_audit_event(item)
        for item in store.audit_logs.find(query, {"_id": 0}).sort("created_at", DESCENDING).limit(max(1, min(int(limit or 12), 50)))
    ]
