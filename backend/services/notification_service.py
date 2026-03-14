from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage

from backend.services.matching_service import match_candidate_to_job
from backend.services.platform_service import isoformat, utcnow


def serialize_notification(notification):
    return {
        "id": notification.get("id"),
        "type": notification.get("type"),
        "title": notification.get("title"),
        "message": notification.get("message"),
        "is_read": bool(notification.get("is_read", False)),
        "email_status": notification.get("email_status") or "skipped",
        "created_at": isoformat(notification.get("created_at")),
        "metadata": notification.get("metadata") or {},
    }


def smtp_is_configured():
    return bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_FROM_EMAIL"))


def send_email_notification(*, to_email, subject, body):
    if not smtp_is_configured():
        return "skipped"

    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME", "")
    password = os.getenv("SMTP_PASSWORD", "")
    use_tls = str(os.getenv("SMTP_USE_TLS", "true")).strip().lower() not in {"0", "false", "no"}

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = os.getenv("SMTP_FROM_EMAIL")
    message["To"] = to_email
    message.set_content(body)

    try:
        with smtplib.SMTP(host, port, timeout=10) as server:
            if use_tls:
                server.starttls()
            if username:
                server.login(username, password)
            server.send_message(message)
        return "sent"
    except Exception:
        return "failed"


def create_notification(store, *, user_id, notification_type, title, message, metadata=None, email=None):
    email_status = send_email_notification(to_email=email, subject=title, body=message) if email else "skipped"
    notification = {
        "id": store.next_sequence("notifications"),
        "user_id": int(user_id),
        "type": notification_type,
        "title": title,
        "message": message,
        "metadata": metadata or {},
        "is_read": False,
        "email_status": email_status,
        "created_at": utcnow(),
    }
    store.notifications.insert_one(notification)
    return notification


def notify_candidates_for_new_job(store, job):
    threshold = int(str(os.getenv("JOB_ALERT_MIN_MATCH", "40")).strip() or "40")
    created = 0
    emailed = 0

    for user_doc in store.users.find({"role": "candidate", "is_active": True}, {"_id": 0}):
        candidate = store.get_account("fresher", user_doc.get("id"))
        if not candidate:
            continue
        match = match_candidate_to_job(candidate, job)
        if match["match_score"] < threshold:
            continue

        notification = create_notification(
            store,
            user_id=candidate["user_id"],
            notification_type="new_job_match",
            title=f"New matched job: {job.get('title') or job.get('job_title')}",
            message=(
                f"{job.get('company_name')} posted {job.get('title') or job.get('job_title')}."
                f" Your profile matches {match['match_score']}% of the required skills."
            ),
            metadata={
                "job_id": job.get("job_id") or job.get("id"),
                "company_name": job.get("company_name"),
                "match_score": match["match_score"],
                "matched_skills": match["matched_skills"],
            },
            email=candidate.get("email"),
        )
        created += 1
        if notification.get("email_status") == "sent":
            emailed += 1

    return {
        "notifications_created": created,
        "emails_sent": emailed,
        "email_mode": "smtp" if smtp_is_configured() else "in_app_only",
    }
