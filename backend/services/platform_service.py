from __future__ import annotations

import os
import re
import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import urlparse

from dotenv import load_dotenv
from flask import current_app, jsonify, session
from pymongo import ASCENDING, DESCENDING, MongoClient, ReturnDocument

from backend.models.documents import build_company_document, build_job_document, build_user_document
from backend.services.auth_service import hash_password

try:
    import mongomock
except ImportError:  # pragma: no cover
    mongomock = None


load_dotenv()


def utcnow():
    return datetime.now(UTC).replace(tzinfo=None)


def isoformat(value):
    if not value:
        return None
    return value.replace(microsecond=0).isoformat() + "Z"


def normalize_email(value):
    return str(value or "").strip().lower()


def ensure_csrf_token():
    token = session.get("csrf_token")
    if not token:
        token = secrets.token_urlsafe(32)
        session["csrf_token"] = token
    return token


def normalize_mongodb_uri():
    mongodb_uri = str(os.getenv("MONGODB_URI", "")).strip()
    if mongodb_uri:
        return mongodb_uri

    database_url = str(os.getenv("DATABASE_URL", "")).strip()
    if database_url.startswith("mongodb://") or database_url.startswith("mongodb+srv://"):
        return database_url

    return "mongodb://127.0.0.1:27017/fresher_connect"


def extract_database_name(uri):
    parsed = urlparse(uri)
    database_name = parsed.path.lstrip("/").split("/", 1)[0]
    return database_name or "fresher_connect"


def build_allowed_origins():
    origins = {"http://127.0.0.1:3000", "http://localhost:3000"}
    configured = str(os.getenv("FRONTEND_ORIGINS", "")).split(",")
    for origin in configured:
        origin = origin.strip()
        if origin:
            origins.add(origin)
    return origins


def is_allowed_origin(origin, allowed_origins):
    return bool(origin and origin in allowed_origins)


def parse_tag_list(value):
    if isinstance(value, list):
        items = value
    else:
        items = re.split(r"[\n,]+", str(value or ""))

    result = []
    seen = set()
    for item in items:
        text = str(item or "").strip()
        if not text:
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(text)
    return result


def parse_skills(value):
    return parse_tag_list(value)


def parse_categories(payload, company=None):
    categories = parse_tag_list(payload.get("categories"))
    if categories:
        return categories

    generated = []
    department = str(payload.get("department") or "").strip()
    industry = str(payload.get("industry_type") or (company or {}).get("industry_type") or "").strip()
    if department:
        generated.append(department)
    if industry:
        generated.append(industry)
    return parse_tag_list(generated)


def parse_bool(value, default=False):
    if value in (None, ""):
        return default
    if isinstance(value, bool):
        return value
    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "y", "on"}:
        return True
    if normalized in {"0", "false", "no", "n", "off"}:
        return False
    return default


def parse_optional_int(value):
    if value in (None, ""):
        return None
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def parse_optional_datetime(value):
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        return value

    text = str(value).strip()
    if not text:
        return None
    try:
        if text.endswith("Z"):
            return datetime.fromisoformat(text.replace("Z", "+00:00")).astimezone(UTC).replace(tzinfo=None)
        parsed = datetime.fromisoformat(text)
        if parsed.tzinfo:
            return parsed.astimezone(UTC).replace(tzinfo=None)
        return parsed
    except ValueError:
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
            try:
                return datetime.strptime(text, fmt)
            except ValueError:
                continue
    return None


def build_job_location(payload):
    direct_location = str(payload.get("location") or "").strip()
    if direct_location:
        return direct_location
    parts = [
        str(payload.get("city") or "").strip(),
        str(payload.get("state") or "").strip(),
        str(payload.get("country") or "").strip(),
    ]
    return ", ".join(part for part in parts if part) or "Location flexible"


def extract_salary_bounds(range_value):
    numbers = [int(item.replace(",", "")) for item in re.findall(r"\d[\d,]*", str(range_value or ""))]
    if not numbers:
        return None, None
    if len(numbers) == 1:
        return numbers[0], numbers[0]
    return numbers[0], numbers[1]


def job_is_active(job):
    if not job:
        return False
    if job.get("is_active") is False:
        return False
    if str(job.get("moderation_status") or "approved").strip().lower() != "approved":
        return False
    expiry_date = parse_optional_datetime(job.get("expiry_date"))
    return not expiry_date or expiry_date >= utcnow()


def distinct_categories(jobs):
    result = []
    seen = set()
    for job in jobs:
        for category in job.get("categories") or []:
            text = str(category).strip()
            key = text.lower()
            if not text or key in seen:
                continue
            seen.add(key)
            result.append(text)
    return sorted(result, key=str.lower)


def profile_completion(account):
    if account.get("role") == "admin":
        fields = [
            account.get("name"),
            account.get("email"),
        ]
        completed = sum(1 for field in fields if field not in (None, "", []))
        return int(round((completed / max(len(fields), 1)) * 100))

    if account.get("role") == "company":
        fields = [
            account.get("contact_name") or account.get("name"),
            account.get("company_name"),
            account.get("company_logo"),
            account.get("company_website"),
            account.get("industry_type"),
            account.get("company_size"),
            account.get("company_description"),
            account.get("location"),
        ]
    else:
        fields = [
            account.get("name"),
            account.get("phone"),
            account.get("location"),
            account.get("education"),
            account.get("grad_year"),
            account.get("skills"),
            account.get("summary"),
            account.get("resume_path"),
            account.get("resume_parsed_skills"),
        ]
    completed = sum(1 for field in fields if field not in (None, "", []))
    return int(round((completed / max(len(fields), 1)) * 100))


def serialize_user(account):
    if not account:
        return None

    if account.get("role") == "admin":
        return {
            "id": account.get("id"),
            "name": account.get("name"),
            "email": account.get("email"),
            "role": "admin",
            "db_role": "admin",
            "is_active": bool(account.get("is_active", True)),
            "profile_completion": profile_completion(account),
            "created_at": isoformat(account.get("created_at")),
        }

    if account.get("role") == "company":
        company_id = account.get("company_id") or account.get("id")
        name = account.get("contact_name") or account.get("name") or account.get("company_name") or "Company"
        return {
            "id": company_id,
            "company_id": company_id,
            "name": name,
            "email": account.get("email"),
            "role": "company",
            "db_role": account.get("db_role") or "company",
            "is_active": bool(account.get("is_active", True)),
            "location": account.get("location"),
            "profile_completion": profile_completion(account),
            "created_at": isoformat(account.get("created_at")),
            "company_name": account.get("company_name") or name,
            "company_logo": account.get("company_logo"),
            "company_website": account.get("company_website") or account.get("website"),
            "industry_type": account.get("industry_type"),
            "company_size": account.get("company_size"),
            "company_description": account.get("company_description") or account.get("description"),
            "verification_status": account.get("verification_status") or "verified",
            "verification_updated_at": isoformat(account.get("verification_updated_at")),
        }

    candidate_id = account.get("user_id") or account.get("id")
    return {
        "id": candidate_id,
        "user_id": candidate_id,
        "name": account.get("name"),
        "email": account.get("email"),
        "role": "fresher",
        "db_role": account.get("db_role") or "candidate",
        "is_active": bool(account.get("is_active", True)),
        "location": account.get("location"),
        "profile_completion": profile_completion(account),
        "created_at": isoformat(account.get("created_at")),
        "phone": account.get("phone"),
        "education": account.get("education"),
        "grad_year": account.get("grad_year"),
        "skills": account.get("skills") or [],
        "experience": account.get("experience"),
        "summary": account.get("summary"),
        "resume_path": account.get("resume_path") or account.get("resume_url"),
        "resume_url": account.get("resume_url"),
        "resume_filename": account.get("resume_filename"),
        "resume_parser_status": account.get("resume_parser_status") or "not_uploaded",
        "resume_text_excerpt": account.get("resume_text_excerpt"),
        "resume_parsed_skills": account.get("resume_parsed_skills") or [],
        "linkedin": account.get("linkedin"),
        "portfolio": account.get("portfolio"),
    }


def serialize_job(job):
    if not job:
        return None

    job_id = job.get("job_id") or job.get("id")
    title = job.get("job_title") or job.get("title")
    description = job.get("job_description") or job.get("description")
    skills = job.get("skills") or job.get("skills_required") or []
    required_skills = job.get("required_skills") or job.get("skills_required") or skills
    created_at = job.get("created_at") or job.get("posted_date")
    expiry_date = job.get("expiry_date")

    return {
        "id": job_id,
        "job_id": job_id,
        "company_id": job.get("company_id"),
        "job_title": title,
        "job_description": description,
        "experience_required": job.get("experience_required"),
        "education_required": job.get("education_required"),
        "salary_min": job.get("salary_min"),
        "salary_max": job.get("salary_max"),
        "location": job.get("location"),
        "employment_type": job.get("employment_type"),
        "skills": skills,
        "posted_date": isoformat(job.get("posted_date")),
        "expiry_date": isoformat(expiry_date),
        "title": title,
        "company_name": job.get("company_name"),
        "company_logo": job.get("company_logo"),
        "company_website": job.get("company_website") or job.get("website"),
        "industry_type": job.get("industry_type"),
        "company_size": job.get("company_size"),
        "company_description": job.get("company_description"),
        "moderation_status": job.get("moderation_status") or "approved",
        "department": job.get("department"),
        "experience_level": job.get("experience_level") or job.get("experience_required"),
        "job_type": job.get("job_type") or job.get("employment_type"),
        "work_mode": job.get("work_mode"),
        "country": job.get("country"),
        "state": job.get("state"),
        "city": job.get("city"),
        "remote_option": bool(job.get("remote_option", False)),
        "degree_required": job.get("degree_required") or job.get("education_required"),
        "required_skills": required_skills,
        "skills_required": required_skills,
        "description": description,
        "role_overview": job.get("role_overview"),
        "responsibilities": job.get("responsibilities"),
        "required_qualifications": job.get("required_qualifications"),
        "preferred_qualifications": job.get("preferred_qualifications"),
        "requirements": job.get("requirements"),
        "salary_range": job.get("salary_range"),
        "internship_stipend": job.get("internship_stipend"),
        "benefits": job.get("benefits"),
        "application_method": job.get("application_method"),
        "application_url": job.get("application_url"),
        "application_email": job.get("application_email"),
        "resume_required": bool(job.get("resume_required", True)),
        "portfolio_required": bool(job.get("portfolio_required", False)),
        "cover_letter_required": bool(job.get("cover_letter_required", False)),
        "hiring_stages": job.get("hiring_stages") or [],
        "expires_at": isoformat(expiry_date),
        "is_active": job_is_active(job),
        "categories": job.get("categories") or [],
        "created_at": isoformat(created_at),
        "posted_by_company_id": job.get("company_id"),
    }


def serialize_application(store, application, include_candidate=False):
    from backend.services.workflow_service import decision_deadline_for, is_application_overdue

    application_id = application.get("application_id") or application.get("id")
    candidate_id = application.get("candidate_id") or application.get("user_id")
    job = store.jobs.find_one({"$or": [{"job_id": application.get("job_id")}, {"id": application.get("job_id")}]}, {"_id": 0})
    candidate = None
    if include_candidate:
        fresher = store.get_account("fresher", candidate_id)
        candidate = serialize_user(fresher)

    decision_deadline = application.get("decision_deadline") or decision_deadline_for(application.get("applied_at"))

    return {
        "id": application_id,
        "application_id": application_id,
        "candidate_id": candidate_id,
        "user_id": candidate_id,
        "company_id": application.get("company_id"),
        "status": application.get("status"),
        "applied_at": isoformat(application.get("applied_at")),
        "updated_at": isoformat(application.get("updated_at")),
        "decision_deadline": isoformat(decision_deadline),
        "is_overdue": bool(is_application_overdue({**application, "decision_deadline": decision_deadline})),
        "interview_at": isoformat(application.get("interview_at")),
        "decision_reason": application.get("decision_reason") or "",
        "job": serialize_job(job) if job else {"id": application.get("job_id"), "title": "Job removed", "company_name": "-"},
        "candidate": candidate,
    }


def json_error(message, status_code):
    return jsonify({"ok": False, "error": message}), status_code


class MongoStore:
    def __init__(self, mongodb_uri, use_mock=False):
        self.mongodb_uri = mongodb_uri
        self.database_name = extract_database_name(mongodb_uri)
        self.use_mock = use_mock
        self._bootstrapped = False

        if use_mock:
            if mongomock is None:
                raise RuntimeError("mongomock_not_installed")
            self.client = mongomock.MongoClient()
        else:
            self.client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=3000, retryWrites=True)

        self.db = self.client[self.database_name]
        self.users = self.db["users"]
        self.candidate_profiles = self.db["candidate_profiles"]
        self.companies = self.db["companies"]
        self.jobs = self.db["jobs"]
        self.applications = self.db["applications"]
        self.saved_jobs = self.db["saved_jobs"]
        self.notifications = self.db["notifications"]
        self.reviews = self.db["reviews"]
        self.counters = self.db["counters"]

    def ping(self):
        if self.use_mock:
            return None
        self.client.admin.command("ping")

    def ensure_indexes(self):
        self.users.create_index([("id", ASCENDING)], unique=True, name="uq_users_id")
        self.users.create_index([("email", ASCENDING)], unique=True, name="uq_users_email")
        self.candidate_profiles.create_index([("user_id", ASCENDING)], unique=True, name="uq_candidate_profiles_user_id")
        self.companies.create_index([("id", ASCENDING)], unique=True, name="uq_companies_id")
        self.companies.create_index([("owner_user_id", ASCENDING)], unique=True, name="uq_companies_owner_user")
        self.jobs.create_index([("id", ASCENDING)], unique=True, name="uq_jobs_id")
        self.jobs.create_index([("company_id", ASCENDING), ("created_at", DESCENDING)], name="ix_jobs_company_created_at")
        self.jobs.create_index([("expiry_date", ASCENDING)], name="ix_jobs_expiry_date")
        self.applications.create_index([("id", ASCENDING)], unique=True, name="uq_applications_id")
        self.applications.create_index(
            [("candidate_id", ASCENDING), ("job_id", ASCENDING)],
            unique=True,
            name="uq_applications_candidate_job",
        )
        self.applications.create_index(
            [("company_id", ASCENDING), ("status", ASCENDING), ("applied_at", DESCENDING)],
            name="ix_applications_company_status",
        )
        self.applications.create_index(
            [("status", ASCENDING), ("decision_deadline", ASCENDING)],
            name="ix_applications_status_deadline",
        )
        self.saved_jobs.create_index([("id", ASCENDING)], unique=True, name="uq_saved_jobs_id")
        self.saved_jobs.create_index(
            [("candidate_id", ASCENDING), ("job_id", ASCENDING)],
            unique=True,
            name="uq_saved_jobs_candidate_job",
        )
        self.notifications.create_index([("id", ASCENDING)], unique=True, name="uq_notifications_id")
        self.notifications.create_index(
            [("user_id", ASCENDING), ("created_at", DESCENDING)],
            name="ix_notifications_user_created_at",
        )
        self.notifications.create_index(
            [("user_id", ASCENDING), ("is_read", ASCENDING), ("created_at", DESCENDING)],
            name="ix_notifications_user_read_state",
        )
        self.reviews.create_index([("id", ASCENDING)], unique=True, name="uq_reviews_id")
        self.reviews.create_index([("created_at", DESCENDING)], name="ix_reviews_created_at")

    def next_sequence(self, name):
        doc = self.counters.find_one_and_update(
            {"_id": name},
            {"$inc": {"seq": 1}, "$setOnInsert": {"created_at": utcnow()}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return int(doc["seq"])

    def bootstrap(self):
        if self._bootstrapped:
            return
        self.ping()
        self.ensure_indexes()
        seed_database(self)
        from backend.services.workflow_service import ensure_workflow_defaults

        ensure_workflow_defaults(self)
        self._bootstrapped = True

    def find_account_by_email(self, email):
        normalized = normalize_email(email)
        return self.users.find_one({"email": normalized}, {"_id": 0})

    def get_account(self, role, account_id):
        if account_id is None:
            return None
        if role == "admin":
            user = self.users.find_one({"id": int(account_id)}, {"_id": 0})
            if not user or user.get("role") != "admin":
                return None
            return {
                "id": user.get("id"),
                "name": user.get("name"),
                "email": user.get("email"),
                "role": "admin",
                "db_role": "admin",
                "is_active": bool(user.get("is_active", True)),
                "created_at": user.get("created_at"),
                "updated_at": user.get("updated_at"),
            }
        if role == "company":
            user = self.users.find_one({"id": int(account_id)}, {"_id": 0})
            company = self.companies.find_one({"owner_user_id": int(account_id)}, {"_id": 0})
            if not company:
                company = self.companies.find_one({"id": int(account_id)}, {"_id": 0})
                if company and not user:
                    user = self.users.find_one({"id": company.get("owner_user_id")}, {"_id": 0})
            if not user or not company:
                return None
            return {
                **company,
                "company_id": company.get("company_id") or company.get("id"),
                "contact_name": user.get("name"),
                "name": user.get("name"),
                "email": user.get("email"),
                "role": "company",
                "db_role": user.get("role", "company"),
                "is_active": bool(user.get("is_active", True)),
                "created_at": user.get("created_at") or company.get("created_at"),
                "updated_at": company.get("updated_at") or user.get("updated_at"),
            }

        user = self.users.find_one({"id": int(account_id)}, {"_id": 0})
        if not user:
            return None
        profile = self.candidate_profiles.find_one({"user_id": int(account_id)}, {"_id": 0}) or {}
        return {
            **profile,
            "id": user.get("id"),
            "user_id": user.get("id"),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": "fresher",
            "db_role": user.get("role", "candidate"),
            "is_active": bool(user.get("is_active", True)),
            "created_at": user.get("created_at"),
            "updated_at": profile.get("updated_at") or user.get("updated_at"),
            "resume_path": profile.get("resume_url"),
        }


def seed_database(store):
    if parse_bool(os.getenv("DISABLE_SEED_DATA"), default=False):
        return

    now = utcnow()
    admin_email = normalize_email(os.getenv("ADMIN_EMAIL", "admin@fresherconnect.local"))
    if not store.users.find_one({"email": admin_email}, {"_id": 0}):
        store.users.insert_one(
            build_user_document(
                user_id=store.next_sequence("users"),
                name=str(os.getenv("ADMIN_NAME", "Platform Admin")).strip() or "Platform Admin",
                email=admin_email,
                password_hash=hash_password(os.getenv("ADMIN_PASSWORD", "Admin@12345")),
                role="admin",
                created_at=now,
            )
        )

    if store.jobs.count_documents({}) == 0:
        companies = [
            {
                "contact_name": "Aisha Verma",
                "email": "hiring@brightstack.com",
                "company_name": "BrightStack Labs",
                "company_logo": "https://images.example.com/brightstack.png",
                "company_website": "https://brightstack.example.com",
                "industry_type": "IT",
                "company_size": "50-200",
                "company_description": "Build internal platforms and backend systems for fast-growing teams.",
                "location": "Bengaluru",
            },
            {
                "contact_name": "Rohan Gupta",
                "email": "careers@insighthive.com",
                "company_name": "Insight Hive",
                "company_logo": "https://images.example.com/insighthive.png",
                "company_website": "https://insighthive.example.com",
                "industry_type": "Finance",
                "company_size": "11-50",
                "company_description": "Data analytics firm focused on reporting pipelines and business intelligence.",
                "location": "Hyderabad",
            },
            {
                "contact_name": "Neha Sharma",
                "email": "jobs@growthdock.com",
                "company_name": "GrowthDock",
                "company_logo": "https://images.example.com/growthdock.png",
                "company_website": "https://growthdock.example.com",
                "industry_type": "Marketing",
                "company_size": "11-50",
                "company_description": "Performance marketing studio running paid growth experiments for digital brands.",
                "location": "Remote",
            },
            {
                "contact_name": "Karan Singh",
                "email": "talent@campusbridge.com",
                "company_name": "CampusBridge",
                "company_logo": "https://images.example.com/campusbridge.png",
                "company_website": "https://campusbridge.example.com",
                "industry_type": "Operations",
                "company_size": "50-200",
                "company_description": "Campus operations partner helping companies streamline onboarding and hiring workflows.",
                "location": "Pune",
            },
        ]

        inserted_companies = []
        for company in companies:
            user_doc = build_user_document(
                user_id=store.next_sequence("users"),
                name=company["contact_name"],
                email=normalize_email(company["email"]),
                password_hash=hash_password("password123"),
                role="company",
                created_at=now,
            )
            company_doc = build_company_document(
                company_id=store.next_sequence("companies"),
                owner_user_id=user_doc["id"],
                company_name=company["company_name"],
                website=company["company_website"],
                location=company["location"],
                description=company["company_description"],
                company_logo=company["company_logo"],
                industry_type=company["industry_type"],
                company_size=company["company_size"],
                created_at=now,
            )
            store.users.insert_one(user_doc)
            store.companies.insert_one(company_doc)
            inserted_companies.append(company_doc)

        job_seed = [
            {
                "title": "Graduate Software Engineer",
                "department": "Engineering",
                "job_type": "full-time",
                "work_mode": "onsite",
                "country": "India",
                "state": "Karnataka",
                "city": "Bengaluru",
                "experience_level": "fresher",
                "degree_required": "B.Tech",
                "required_skills": ["Python", "Git", "APIs"],
                "description": "Build internal platform features, ship production code, and learn modern backend systems.",
                "role_overview": "Join the backend team and contribute to production services.",
                "responsibilities": "Develop APIs, fix bugs, and participate in code reviews.",
                "required_qualifications": "Strong CS fundamentals and project experience in software development.",
                "preferred_qualifications": "Internship or strong GitHub portfolio.",
                "salary_range": "INR 4 LPA - INR 8 LPA",
                "benefits": "Health insurance, mentorship, learning stipend",
                "categories": ["CS", "IT"],
                "expiry_days": 45,
            },
            {
                "title": "Data Analyst Trainee",
                "department": "Analytics",
                "job_type": "full-time",
                "work_mode": "onsite",
                "country": "India",
                "state": "Telangana",
                "city": "Hyderabad",
                "experience_level": "0-1 year",
                "degree_required": "Any Graduate",
                "required_skills": ["SQL", "Excel", "Dashboards"],
                "description": "Work on dashboards, reporting pipelines, and stakeholder-ready analytics.",
                "role_overview": "Support the analytics team with reporting and automation.",
                "responsibilities": "Prepare dashboards and clean business datasets.",
                "required_qualifications": "Comfort with spreadsheets and data storytelling.",
                "preferred_qualifications": "Experience with BI tools.",
                "salary_range": "INR 3 LPA - INR 5 LPA",
                "benefits": "Training budget, hybrid flexibility",
                "categories": ["CS", "Finance"],
                "expiry_days": 40,
            },
            {
                "title": "Performance Marketing Associate",
                "department": "Marketing",
                "job_type": "full-time",
                "work_mode": "remote",
                "country": "India",
                "state": "",
                "city": "Remote",
                "experience_level": "entry-level",
                "degree_required": "Any Graduate",
                "required_skills": ["Meta Ads", "Google Ads", "Reporting"],
                "description": "Support paid campaigns, creatives, and weekly growth experiments.",
                "role_overview": "Own campaign execution with the performance team.",
                "responsibilities": "Track campaign metrics and launch growth experiments.",
                "required_qualifications": "Analytical mindset and good written communication.",
                "preferred_qualifications": "Marketing internship or ad platform exposure.",
                "salary_range": "INR 3 LPA - INR 6 LPA",
                "benefits": "Remote allowance, performance bonus",
                "categories": ["Marketing"],
                "expiry_days": 35,
            },
            {
                "title": "Operations Executive",
                "department": "Operations",
                "job_type": "internship",
                "work_mode": "onsite",
                "country": "India",
                "state": "Maharashtra",
                "city": "Pune",
                "experience_level": "fresher",
                "degree_required": "Any Graduate",
                "required_skills": ["Coordination", "Documentation", "Excel"],
                "description": "Coordinate fresher onboarding workflows and internal hiring operations.",
                "role_overview": "Help the operations team run daily campus hiring workflows.",
                "responsibilities": "Coordinate candidate schedules and update trackers.",
                "required_qualifications": "Strong ownership and communication skills.",
                "preferred_qualifications": "Campus ambassador or event coordination experience.",
                "internship_stipend": "INR 18,000 / month",
                "benefits": "Certificate, mentorship, potential PPO",
                "categories": ["Operations"],
                "expiry_days": 30,
            },
        ]

        for index, job in enumerate(job_seed):
            company = inserted_companies[index]
            salary_min, salary_max = extract_salary_bounds(job.get("salary_range"))
            posted_date = now - timedelta(days=index + 1)
            expiry_date = posted_date + timedelta(days=job["expiry_days"])
            store.jobs.insert_one(
                build_job_document(
                    job_id=store.next_sequence("jobs"),
                    company_doc=company,
                    title=job["title"],
                    description=job["description"],
                    experience_required=job["experience_level"],
                    education_required=job["degree_required"],
                    salary_min=salary_min,
                    salary_max=salary_max,
                    location=build_job_location(job),
                    employment_type=job["job_type"],
                    required_skills=job["required_skills"],
                    posted_date=posted_date,
                    expiry_date=expiry_date,
                    department=job["department"],
                    work_mode=job["work_mode"],
                    country=job["country"],
                    state=job["state"],
                    city=job["city"],
                    remote_option=job["work_mode"] == "remote",
                    role_overview=job["role_overview"],
                    responsibilities=job["responsibilities"],
                    required_qualifications=job["required_qualifications"],
                    preferred_qualifications=job["preferred_qualifications"],
                    salary_range=job.get("salary_range"),
                    internship_stipend=job.get("internship_stipend"),
                    benefits=job.get("benefits"),
                    application_method="platform",
                    application_url="",
                    application_email="",
                    resume_required=True,
                    portfolio_required=False,
                    cover_letter_required=False,
                    hiring_stages=["Resume Screening", "Interview", "Offer"],
                    categories=job["categories"],
                    created_at=posted_date,
                )
            )

    if store.reviews.count_documents({}) == 0:
        review_seed = [
            {
                "name": "Aarav",
                "role": "fresher",
                "rating": 5,
                "review": "Job listing se apply flow tak sab pages connected feel hote hain, isliye tracking easy ho gayi.",
            },
            {
                "name": "Nisha",
                "role": "company",
                "rating": 4,
                "review": "Company dashboard aur applicant review workflow straightforward hai, especially fresher hiring ke liye.",
            },
        ]

        for index, item in enumerate(review_seed):
            created_at = now - timedelta(days=index + 2)
            store.reviews.insert_one(
                {
                    "id": store.next_sequence("reviews"),
                    "name": item["name"],
                    "role": item["role"],
                    "rating": item["rating"],
                    "review": item["review"],
                    "user_id": None,
                    "created_at": created_at,
                    "updated_at": created_at,
                }
            )


def get_store():
    return current_app.extensions["mongo_store"]


__all__ = [
    "MongoStore",
    "build_allowed_origins",
    "build_job_location",
    "distinct_categories",
    "ensure_csrf_token",
    "extract_salary_bounds",
    "get_store",
    "is_allowed_origin",
    "job_is_active",
    "json_error",
    "normalize_email",
    "normalize_mongodb_uri",
    "parse_bool",
    "parse_categories",
    "parse_optional_datetime",
    "parse_optional_int",
    "parse_skills",
    "parse_tag_list",
    "profile_completion",
    "seed_database",
    "serialize_application",
    "serialize_job",
    "serialize_user",
    "utcnow",
]
