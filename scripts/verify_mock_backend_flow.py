from __future__ import annotations

import io
import os
import sys
from datetime import timedelta
from pathlib import Path

from flask import request


os.environ.setdefault("MONGODB_USE_MOCK", "true")
os.environ.setdefault("DISABLE_SEED_DATA", "true")
os.environ.setdefault("SECRET_KEY", "ci-secret-key")

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import create_app
from backend.models.documents import build_user_document
from backend.services.auth_service import hash_password
from backend.services.platform_service import utcnow
from backend.services.rate_limit_service import check_rate_limit
from backend.services.workflow_service import process_application_sla


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def main():
    app = create_app()
    client = app.test_client()

    company_register = client.post(
        "/auth/register",
        json={
            "role": "company",
            "name": "Hiring Manager",
            "email": "company@example.com",
            "password": "password123",
            "company_name": "Example Corp",
            "company_logo": "https://example.com/logo.png",
            "company_website": "https://example.com",
            "industry_type": "IT",
            "company_size": "11-50",
            "company_description": "Example hiring company",
        },
    )
    assert company_register.status_code == 201, company_register.get_data(as_text=True)
    company_token = company_register.get_json()["access_token"]

    job_create = client.post(
        "/jobs",
        json={
            "company_name": "Example Corp",
            "company_logo": "https://example.com/logo.png",
            "company_website": "https://example.com",
            "industry_type": "IT",
            "company_size": "11-50",
            "company_description": "Example hiring company",
            "title": "Platform Engineer",
            "department": "Engineering",
            "job_type": "full-time",
            "work_mode": "hybrid",
            "country": "India",
            "state": "Uttar Pradesh",
            "city": "Noida",
            "remote_option": "true",
            "experience_level": "fresher",
            "degree_required": "B.Tech",
            "required_skills": "Python, Docker, Git",
            "description": "Build backend systems",
            "role_overview": "Own platform modules",
            "responsibilities": "Build APIs",
            "required_qualifications": "Strong fundamentals",
            "preferred_qualifications": "Internship experience",
            "salary_range": "400000 - 800000",
            "benefits": "Insurance",
            "application_method": "platform",
            "resume_required": "true",
            "portfolio_required": "false",
            "cover_letter_required": "false",
            "hiring_stages": "Resume Screening, Technical Interview, HR Interview",
            "expiry_days": "30",
        },
        headers=auth_headers(company_token),
    )
    assert job_create.status_code == 200, job_create.get_data(as_text=True)
    job_id = job_create.get_json()["job"]["id"]

    list_jobs = client.get("/jobs")
    assert list_jobs.status_code == 200, list_jobs.get_data(as_text=True)
    assert any(job["id"] == job_id for job in list_jobs.get_json()["jobs"])
    assert list_jobs.get_json()["pagination"]["page"] == 1, list_jobs.get_json()

    paged_jobs = client.get("/api/jobs?page=1&page_size=1")
    assert paged_jobs.status_code == 200, paged_jobs.get_data(as_text=True)
    paged_payload = paged_jobs.get_json()
    assert len(paged_payload["jobs"]) == 1, paged_payload
    assert paged_payload["pagination"]["total"] >= 1, paged_payload
    assert paged_payload["pagination"]["page_size"] == 1, paged_payload

    job_detail = client.get(f"/jobs/{job_id}")
    assert job_detail.status_code == 200, job_detail.get_data(as_text=True)
    assert job_detail.get_json()["job"]["id"] == job_id

    filtered_jobs = client.get(
        "/api/jobs?location=Noida&company=Example%20Corp&skills=Python,Docker&experience=fresher&salary_min=400000&salary_max=900000"
    )
    assert filtered_jobs.status_code == 200, filtered_jobs.get_data(as_text=True)
    filtered_payload = filtered_jobs.get_json()
    assert filtered_payload["jobs"], filtered_payload
    assert filtered_payload["jobs"][0]["id"] == job_id, filtered_payload

    unmatched_jobs = client.get("/api/jobs?company=Unknown%20Company")
    assert unmatched_jobs.status_code == 200, unmatched_jobs.get_data(as_text=True)
    assert unmatched_jobs.get_json()["jobs"] == [], unmatched_jobs.get_json()

    logout_company = client.post("/auth/logout", headers=auth_headers(company_token))
    assert logout_company.status_code == 200, logout_company.get_data(as_text=True)

    user_register = client.post(
        "/auth/register",
        json={
            "role": "fresher",
            "name": "Test User",
            "email": "user@example.com",
            "password": "password123",
            "phone": "9999999999",
            "location": "Noida",
            "education": "B.Tech",
            "grad_year": 2026,
            "skills": "Python, Docker",
            "summary": "Fresher engineer",
            "resume_path": "resume.pdf",
        },
    )
    assert user_register.status_code == 201, user_register.get_data(as_text=True)
    user_token = user_register.get_json()["access_token"]

    resume_upload = client.post(
        "/api/user/resume",
        data={"resume": (io.BytesIO(b"Python Docker AWS Git Kubernetes CI/CD"), "resume.pdf")},
        headers=auth_headers(user_token),
        content_type="multipart/form-data",
    )
    assert resume_upload.status_code == 200, resume_upload.get_data(as_text=True)
    assert "Python" in resume_upload.get_json()["resume_analysis"]["skills"], resume_upload.get_json()

    dashboard = client.get("/api/user/dashboard", headers=auth_headers(user_token))
    assert dashboard.status_code == 200, dashboard.get_data(as_text=True)
    assert any(job["id"] == job_id for job in dashboard.get_json()["jobs"])
    assert dashboard.get_json()["saved_jobs"] == []
    matched_job = next(job for job in dashboard.get_json()["jobs"] if job["id"] == job_id)
    assert matched_job["match_score"] >= 60, matched_job
    assert "Docker" in dashboard.get_json()["user"]["resume_parsed_skills"], dashboard.get_json()["user"]

    rest_jobs_for_user = client.get("/jobs", headers=auth_headers(user_token))
    assert rest_jobs_for_user.status_code == 200, rest_jobs_for_user.get_data(as_text=True)
    user_visible_job = next(job for job in rest_jobs_for_user.get_json()["jobs"] if job["id"] == job_id)
    assert user_visible_job["match_score"] >= 60, user_visible_job

    detail_for_user = client.get(f"/jobs/{job_id}", headers=auth_headers(user_token))
    assert detail_for_user.status_code == 200, detail_for_user.get_data(as_text=True)
    assert detail_for_user.get_json()["job"]["match_score"] >= 60, detail_for_user.get_json()

    save_job = client.post(
        "/api/saved-jobs",
        json={"job_id": job_id},
        headers=auth_headers(user_token),
    )
    assert save_job.status_code == 200, save_job.get_data(as_text=True)

    saved_jobs = client.get("/api/saved-jobs", headers=auth_headers(user_token))
    assert saved_jobs.status_code == 200, saved_jobs.get_data(as_text=True)
    assert saved_jobs.get_json()["saved_jobs"][0]["id"] == job_id

    apply_once = client.post(
        f"/apply/{job_id}",
        headers=auth_headers(user_token),
    )
    assert apply_once.status_code == 200, apply_once.get_data(as_text=True)
    application_payload = apply_once.get_json()["application"]
    application_id = application_payload["id"]
    assert application_payload["decision_deadline"], application_payload

    apply_twice = client.post(
        f"/apply/{job_id}",
        headers=auth_headers(user_token),
    )
    assert apply_twice.status_code == 409, apply_twice.get_data(as_text=True)

    applications_list = client.get("/applications", headers=auth_headers(user_token))
    assert applications_list.status_code == 200, applications_list.get_data(as_text=True)
    assert applications_list.get_json()["applications"][0]["id"] == application_id

    logout_user = client.post("/auth/logout", headers=auth_headers(user_token))
    assert logout_user.status_code == 200, logout_user.get_data(as_text=True)

    company_login = client.post(
        "/auth/login",
        json={"email": "company@example.com", "password": "password123"},
    )
    assert company_login.status_code == 200, company_login.get_data(as_text=True)
    company_login_token = company_login.get_json()["access_token"]

    company_dashboard = client.get("/api/company/dashboard", headers=auth_headers(company_login_token))
    assert company_dashboard.status_code == 200, company_dashboard.get_data(as_text=True)
    company_dashboard_payload = company_dashboard.get_json()
    applications = company_dashboard_payload["applications"]
    assert applications[0]["id"] == application_id, applications
    assert applications[0]["match_score"] >= 60, applications[0]
    assert company_dashboard_payload["analytics"]["total_applicants"] == 1, company_dashboard_payload
    assert company_dashboard_payload["recent_activity"], company_dashboard_payload

    matched_job_create = client.post(
        "/jobs",
        json={
            "company_name": "Example Corp",
            "company_logo": "https://example.com/logo.png",
            "company_website": "https://example.com",
            "industry_type": "IT",
            "company_size": "11-50",
            "company_description": "Example hiring company",
            "title": "DevOps Graduate Engineer",
            "department": "Engineering",
            "job_type": "full-time",
            "work_mode": "remote",
            "country": "India",
            "state": "Uttar Pradesh",
            "city": "Noida",
            "remote_option": "true",
            "experience_level": "fresher",
            "degree_required": "B.Tech",
            "required_skills": "Python, Docker, AWS",
            "description": "Support automation and cloud operations",
            "role_overview": "Work on deployment pipelines and platform reliability.",
            "responsibilities": "Automate tasks and support releases.",
            "required_qualifications": "Strong fundamentals and scripting exposure.",
            "preferred_qualifications": "Cloud certification or internship experience.",
            "salary_range": "500000 - 900000",
            "benefits": "Insurance, learning budget",
            "application_method": "platform",
            "resume_required": "true",
            "portfolio_required": "false",
            "cover_letter_required": "false",
            "hiring_stages": "Resume Screening, Technical Interview, HR Interview",
            "expiry_days": "30",
        },
        headers=auth_headers(company_login_token),
    )
    assert matched_job_create.status_code == 200, matched_job_create.get_data(as_text=True)
    assert matched_job_create.get_json()["notification_summary"]["notifications_created"] == 1, matched_job_create.get_json()

    status_update = client.patch(
        f"/api/company/applications/{application_id}",
        json={"status": "interview", "interview_at": "2026-04-15T10:30"},
        headers=auth_headers(company_login_token),
    )
    assert status_update.status_code == 200, status_update.get_data(as_text=True)
    status_payload = status_update.get_json()["application"]
    assert status_payload["status"] == "interview", status_payload
    assert status_payload["interview_at"], status_payload

    logout_company_again = client.post("/auth/logout", headers=auth_headers(company_login_token))
    assert logout_company_again.status_code == 200, logout_company_again.get_data(as_text=True)

    late_user_register = client.post(
        "/auth/register",
        json={
            "role": "fresher",
            "name": "Late User",
            "email": "late.user@example.com",
            "password": "password123",
            "phone": "8888888888",
            "location": "Noida",
            "education": "B.Tech",
            "grad_year": 2026,
            "skills": "Python",
            "summary": "Late workflow candidate",
            "resume_path": "late-resume.pdf",
        },
    )
    assert late_user_register.status_code == 201, late_user_register.get_data(as_text=True)
    late_user_token = late_user_register.get_json()["access_token"]

    late_apply = client.post(
        f"/apply/{job_id}",
        headers=auth_headers(late_user_token),
    )
    assert late_apply.status_code == 200, late_apply.get_data(as_text=True)
    late_application_id = late_apply.get_json()["application"]["id"]

    with app.app_context():
        store = app.extensions["mongo_store"]
        overdue_applied_at = utcnow() - timedelta(days=8)
        overdue_deadline = overdue_applied_at + timedelta(days=7)
        store.applications.update_one(
            {"application_id": late_application_id},
            {
                "$set": {
                    "status": "reviewing",
                    "applied_at": overdue_applied_at,
                    "updated_at": overdue_applied_at,
                    "decision_deadline": overdue_deadline,
                }
            },
        )
        sla_result = process_application_sla(store)
        assert late_application_id in sla_result["expired_application_ids"], sla_result
        late_application_doc = store.applications.find_one({"application_id": late_application_id}, {"_id": 0})
        assert late_application_doc["status"] == "rejected", late_application_doc
        assert late_application_doc["decision_reason"] == "Auto-closed after 7 days without recruiter action.", late_application_doc
        company_timeout_notifications = list(
            store.notifications.find(
                {"type": "application_timeout_company", "metadata.application_id": late_application_id},
                {"_id": 0},
            )
        )
        assert company_timeout_notifications, "Expected company SLA notification"

    logout_late_user = client.post("/auth/logout", headers=auth_headers(late_user_token))
    assert logout_late_user.status_code == 200, logout_late_user.get_data(as_text=True)

    user_login = client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert user_login.status_code == 200, user_login.get_data(as_text=True)
    user_login_token = user_login.get_json()["access_token"]

    final_dashboard = client.get("/api/user/dashboard", headers=auth_headers(user_login_token))
    assert final_dashboard.status_code == 200, final_dashboard.get_data(as_text=True)
    final_applications = final_dashboard.get_json()["applications"]
    assert final_applications[0]["status"] == "interview", final_applications
    assert final_applications[0]["interview_at"], final_applications[0]
    assert final_dashboard.get_json()["saved_jobs"][0]["id"] == job_id
    assert final_dashboard.get_json()["notifications"], final_dashboard.get_json()

    notifications = client.get("/notifications", headers=auth_headers(user_login_token))
    assert notifications.status_code == 200, notifications.get_data(as_text=True)
    notification_payload = notifications.get_json()
    assert notification_payload["unread_count"] >= 1, notification_payload

    first_notification_id = notification_payload["notifications"][0]["id"]
    notification_read = client.patch(
        f"/notifications/{first_notification_id}/read",
        headers=auth_headers(user_login_token),
    )
    assert notification_read.status_code == 200, notification_read.get_data(as_text=True)
    assert notification_read.get_json()["unread_count"] < notification_payload["unread_count"], notification_read.get_json()

    late_user_login = client.post(
        "/auth/login",
        json={"email": "late.user@example.com", "password": "password123"},
    )
    assert late_user_login.status_code == 200, late_user_login.get_data(as_text=True)
    late_user_token = late_user_login.get_json()["access_token"]

    late_user_applications = client.get("/applications", headers=auth_headers(late_user_token))
    assert late_user_applications.status_code == 200, late_user_applications.get_data(as_text=True)
    assert late_user_applications.get_json()["applications"][0]["status"] == "rejected", late_user_applications.get_json()

    late_user_notifications = client.get("/notifications", headers=auth_headers(late_user_token))
    assert late_user_notifications.status_code == 200, late_user_notifications.get_data(as_text=True)
    assert any(item["type"] == "application_timeout" for item in late_user_notifications.get_json()["notifications"]), late_user_notifications.get_json()

    logout_late_user_again = client.post("/auth/logout", headers=auth_headers(late_user_token))
    assert logout_late_user_again.status_code == 200, logout_late_user_again.get_data(as_text=True)

    with app.app_context():
        store = app.extensions["mongo_store"]
        store.users.insert_one(
            build_user_document(
                user_id=store.next_sequence("users"),
                name="Platform Admin",
                email="admin@example.com",
                password_hash=hash_password("Admin@12345"),
                role="admin",
                created_at=utcnow(),
            )
        )

    admin_login = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "Admin@12345"},
    )
    assert admin_login.status_code == 200, admin_login.get_data(as_text=True)
    admin_token = admin_login.get_json()["access_token"]

    admin_dashboard = client.get("/api/admin/dashboard", headers=auth_headers(admin_token))
    assert admin_dashboard.status_code == 200, admin_dashboard.get_data(as_text=True)
    assert admin_dashboard.get_json()["analytics"]["saved_jobs"] == 1
    assert admin_dashboard.get_json()["analytics"]["verified_companies"] == 1, admin_dashboard.get_json()
    assert admin_dashboard.get_json()["recent_activity"], admin_dashboard.get_json()

    pending_company = client.patch(
        f"/api/admin/users/{company_register.get_json()['user']['id']}",
        json={"is_active": True, "verification_status": "pending"},
        headers=auth_headers(admin_token),
    )
    assert pending_company.status_code == 200, pending_company.get_data(as_text=True)
    assert pending_company.get_json()["user"]["verification_status"] == "pending", pending_company.get_json()

    admin_dashboard_after_pending = client.get("/api/admin/dashboard", headers=auth_headers(admin_token))
    assert admin_dashboard_after_pending.status_code == 200, admin_dashboard_after_pending.get_data(as_text=True)
    analytics_after_pending = admin_dashboard_after_pending.get_json()["analytics"]
    assert analytics_after_pending["pending_companies"] == 1, analytics_after_pending

    moderate_job = client.patch(
        f"/api/admin/jobs/{job_id}",
        json={"moderation_status": "pending", "is_active": True},
        headers=auth_headers(admin_token),
    )
    assert moderate_job.status_code == 200, moderate_job.get_data(as_text=True)

    moderated_jobs = client.get("/api/jobs")
    assert moderated_jobs.status_code == 200, moderated_jobs.get_data(as_text=True)
    assert not any(job["id"] == job_id for job in moderated_jobs.get_json()["jobs"])

    disable_user = client.patch(
        f"/api/admin/users/{user_register.get_json()['user']['id']}",
        json={"is_active": False},
        headers=auth_headers(admin_token),
    )
    assert disable_user.status_code == 200, disable_user.get_data(as_text=True)

    disabled_dashboard = client.get("/api/user/dashboard", headers=auth_headers(user_login_token))
    assert disabled_dashboard.status_code == 403, disabled_dashboard.get_data(as_text=True)

    company_login_pending = client.post(
        "/auth/login",
        json={"email": "company@example.com", "password": "password123"},
    )
    assert company_login_pending.status_code == 200, company_login_pending.get_data(as_text=True)
    company_pending_token = company_login_pending.get_json()["access_token"]

    pending_job_create = client.post(
        "/jobs",
        json={
            "company_name": "Example Corp",
            "company_logo": "https://example.com/logo.png",
            "company_website": "https://example.com",
            "industry_type": "IT",
            "company_size": "11-50",
            "company_description": "Example hiring company",
            "title": "Verification Queue Role",
            "department": "Engineering",
            "job_type": "full-time",
            "work_mode": "onsite",
            "country": "India",
            "state": "Uttar Pradesh",
            "city": "Noida",
            "remote_option": "false",
            "experience_level": "fresher",
            "degree_required": "B.Tech",
            "required_skills": "Python, Git",
            "description": "Awaiting verification approval",
            "role_overview": "Held for moderation while company verification is pending.",
            "responsibilities": "Contribute to product delivery.",
            "required_qualifications": "Strong fundamentals.",
            "preferred_qualifications": "Internship experience.",
            "salary_range": "300000 - 500000",
            "benefits": "Learning budget",
            "application_method": "platform",
            "resume_required": "true",
            "portfolio_required": "false",
            "cover_letter_required": "false",
            "hiring_stages": "Resume Screening, HR Interview",
            "expiry_days": "30",
        },
        headers=auth_headers(company_pending_token),
    )
    assert pending_job_create.status_code == 200, pending_job_create.get_data(as_text=True)
    pending_job_payload = pending_job_create.get_json()
    assert pending_job_payload["job"]["moderation_status"] == "pending", pending_job_payload
    assert pending_job_payload["job"]["is_active"] is False, pending_job_payload
    assert pending_job_payload["notification_summary"]["notifications_created"] == 0, pending_job_payload

    logout_pending_company = client.post("/auth/logout", headers=auth_headers(company_pending_token))
    assert logout_pending_company.status_code == 200, logout_pending_company.get_data(as_text=True)

    health = client.get("/healthz")
    assert health.status_code == 200, health.get_data(as_text=True)

    with app.test_request_context("/auth/login", headers={"X-Forwarded-For": "203.0.113.9"}):
        original_max = app.config["FC_AUTH_RATE_LIMIT_MAX"]
        original_window = app.config["FC_AUTH_RATE_LIMIT_WINDOW"]
        app.config["FC_AUTH_RATE_LIMIT_MAX"] = 1
        app.config["FC_AUTH_RATE_LIMIT_WINDOW"] = 60
        first_limit = check_rate_limit(app.config, request)
        second_limit = check_rate_limit(app.config, request)
        app.config["FC_AUTH_RATE_LIMIT_MAX"] = original_max
        app.config["FC_AUTH_RATE_LIMIT_WINDOW"] = original_window
        assert first_limit["allowed"] is True, first_limit
        assert second_limit["allowed"] is False, second_limit

    print("mock_backend_flow_ok")


if __name__ == "__main__":
    main()
