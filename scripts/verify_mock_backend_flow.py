from __future__ import annotations

import os
import sys
from pathlib import Path


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

    dashboard = client.get("/api/user/dashboard", headers=auth_headers(user_token))
    assert dashboard.status_code == 200, dashboard.get_data(as_text=True)
    assert any(job["id"] == job_id for job in dashboard.get_json()["jobs"])
    assert dashboard.get_json()["saved_jobs"] == []

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
    application_id = apply_once.get_json()["application"]["id"]

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
    applications = company_dashboard.get_json()["applications"]
    assert applications[0]["id"] == application_id, applications

    status_update = client.patch(
        f"/api/company/applications/{application_id}",
        json={"status": "shortlisted"},
        headers=auth_headers(company_login_token),
    )
    assert status_update.status_code == 200, status_update.get_data(as_text=True)

    logout_company_again = client.post("/auth/logout", headers=auth_headers(company_login_token))
    assert logout_company_again.status_code == 200, logout_company_again.get_data(as_text=True)

    user_login = client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert user_login.status_code == 200, user_login.get_data(as_text=True)
    user_login_token = user_login.get_json()["access_token"]

    final_dashboard = client.get("/api/user/dashboard", headers=auth_headers(user_login_token))
    assert final_dashboard.status_code == 200, final_dashboard.get_data(as_text=True)
    final_applications = final_dashboard.get_json()["applications"]
    assert final_applications[0]["status"] == "shortlisted", final_applications
    assert final_dashboard.get_json()["saved_jobs"][0]["id"] == job_id

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

    health = client.get("/healthz")
    assert health.status_code == 200, health.get_data(as_text=True)

    print("mock_backend_flow_ok")


if __name__ == "__main__":
    main()
