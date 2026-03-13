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


def csrf_headers(client):
    response = client.get("/api/session")
    assert response.status_code == 200, response.get_data(as_text=True)
    token = response.get_json()["csrf_token"]
    return {"X-CSRF-Token": token}


def main():
    app = create_app()
    client = app.test_client()

    company_register = client.post(
        "/api/auth/register",
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
        headers=csrf_headers(client),
    )
    assert company_register.status_code == 200, company_register.get_data(as_text=True)

    job_create = client.post(
        "/api/company/jobs",
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
        headers=csrf_headers(client),
    )
    assert job_create.status_code == 200, job_create.get_data(as_text=True)
    job_id = job_create.get_json()["job"]["id"]

    list_jobs = client.get("/api/jobs")
    assert list_jobs.status_code == 200, list_jobs.get_data(as_text=True)
    assert any(job["id"] == job_id for job in list_jobs.get_json()["jobs"])

    logout_company = client.post("/api/auth/logout", headers=csrf_headers(client))
    assert logout_company.status_code == 200, logout_company.get_data(as_text=True)

    user_register = client.post(
        "/api/auth/register",
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
        headers=csrf_headers(client),
    )
    assert user_register.status_code == 200, user_register.get_data(as_text=True)

    dashboard = client.get("/api/user/dashboard")
    assert dashboard.status_code == 200, dashboard.get_data(as_text=True)
    assert any(job["id"] == job_id for job in dashboard.get_json()["jobs"])

    apply_once = client.post(
        "/api/applications",
        json={"job_id": job_id},
        headers=csrf_headers(client),
    )
    assert apply_once.status_code == 200, apply_once.get_data(as_text=True)
    application_id = apply_once.get_json()["application"]["id"]

    apply_twice = client.post(
        "/api/applications",
        json={"job_id": job_id},
        headers=csrf_headers(client),
    )
    assert apply_twice.status_code == 409, apply_twice.get_data(as_text=True)

    logout_user = client.post("/api/auth/logout", headers=csrf_headers(client))
    assert logout_user.status_code == 200, logout_user.get_data(as_text=True)

    company_login = client.post(
        "/api/auth/login",
        json={"email": "company@example.com", "password": "password123"},
        headers=csrf_headers(client),
    )
    assert company_login.status_code == 200, company_login.get_data(as_text=True)

    company_dashboard = client.get("/api/company/dashboard")
    assert company_dashboard.status_code == 200, company_dashboard.get_data(as_text=True)
    applications = company_dashboard.get_json()["applications"]
    assert applications[0]["id"] == application_id, applications

    status_update = client.patch(
        f"/api/company/applications/{application_id}",
        json={"status": "interview"},
        headers=csrf_headers(client),
    )
    assert status_update.status_code == 200, status_update.get_data(as_text=True)

    logout_company_again = client.post("/api/auth/logout", headers=csrf_headers(client))
    assert logout_company_again.status_code == 200, logout_company_again.get_data(as_text=True)

    user_login = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "password123"},
        headers=csrf_headers(client),
    )
    assert user_login.status_code == 200, user_login.get_data(as_text=True)

    final_dashboard = client.get("/api/user/dashboard")
    assert final_dashboard.status_code == 200, final_dashboard.get_data(as_text=True)
    final_applications = final_dashboard.get_json()["applications"]
    assert final_applications[0]["status"] == "interview", final_applications

    health = client.get("/healthz")
    assert health.status_code == 200, health.get_data(as_text=True)

    print("mock_backend_flow_ok")


if __name__ == "__main__":
    main()
