from __future__ import annotations

import os
import re
import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import urlparse

from dotenv import load_dotenv
from flask import current_app, jsonify, session
from pymongo import ASCENDING, DESCENDING, MongoClient, ReturnDocument
from werkzeug.security import generate_password_hash

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
        ]
    completed = sum(1 for field in fields if field not in (None, "", []))
    return int(round((completed / max(len(fields), 1)) * 100))


def serialize_user(account):
    if not account:
        return None

    if account.get("role") == "company":
        name = account.get("contact_name") or account.get("name") or account.get("company_name") or "Company"
        return {
            "id": account.get("company_id"),
            "company_id": account.get("company_id"),
            "name": name,
            "email": account.get("email"),
            "role": "company",
            "location": account.get("location"),
            "profile_completion": profile_completion(account),
            "created_at": isoformat(account.get("created_at")),
            "company_name": account.get("company_name") or name,
            "company_logo": account.get("company_logo"),
            "company_website": account.get("company_website"),
            "industry_type": account.get("industry_type"),
            "company_size": account.get("company_size"),
            "company_description": account.get("company_description"),
        }

    return {
        "id": account.get("user_id"),
        "user_id": account.get("user_id"),
        "name": account.get("name"),
        "email": account.get("email"),
        "role": "fresher",
        "location": account.get("location"),
        "profile_completion": profile_completion(account),
        "created_at": isoformat(account.get("created_at")),
        "phone": account.get("phone"),
        "education": account.get("education"),
        "grad_year": account.get("grad_year"),
        "skills": account.get("skills") or [],
        "summary": account.get("summary"),
        "resume_path": account.get("resume_path"),
        "is_premium": bool(account.get("is_premium", False)),
    }


def serialize_job(job):
    if not job:
        return None

    return {
        "id": job.get("job_id"),
        "job_id": job.get("job_id"),
        "company_id": job.get("company_id"),
        "job_title": job.get("job_title"),
        "job_description": job.get("job_description"),
        "experience_required": job.get("experience_required"),
        "education_required": job.get("education_required"),
        "salary_min": job.get("salary_min"),
        "salary_max": job.get("salary_max"),
        "location": job.get("location"),
        "employment_type": job.get("employment_type"),
        "skills": job.get("skills") or [],
        "posted_date": isoformat(job.get("posted_date")),
        "expiry_date": isoformat(job.get("expiry_date")),
        "title": job.get("job_title"),
        "company_name": job.get("company_name"),
        "company_logo": job.get("company_logo"),
        "company_website": job.get("company_website"),
        "industry_type": job.get("industry_type"),
        "company_size": job.get("company_size"),
        "company_description": job.get("company_description"),
        "department": job.get("department"),
        "experience_level": job.get("experience_level") or job.get("experience_required"),
        "job_type": job.get("job_type") or job.get("employment_type"),
        "work_mode": job.get("work_mode"),
        "country": job.get("country"),
        "state": job.get("state"),
        "city": job.get("city"),
        "remote_option": bool(job.get("remote_option", False)),
        "degree_required": job.get("degree_required") or job.get("education_required"),
        "required_skills": job.get("required_skills") or job.get("skills") or [],
        "description": job.get("description") or job.get("job_description"),
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
        "expires_at": isoformat(job.get("expiry_date")),
        "is_active": job_is_active(job),
        "categories": job.get("categories") or [],
        "created_at": isoformat(job.get("created_at")),
        "posted_by_company_id": job.get("company_id"),
    }


def serialize_application(store, application, include_candidate=False):
    job = store.jobs.find_one({"job_id": application.get("job_id")}, {"_id": 0})
    candidate = None
    if include_candidate:
        fresher = store.users.find_one({"user_id": application.get("user_id")}, {"_id": 0})
        candidate = serialize_user(fresher)

    return {
        "id": application.get("application_id"),
        "application_id": application.get("application_id"),
        "user_id": application.get("user_id"),
        "company_id": application.get("company_id"),
        "status": application.get("status"),
        "applied_at": isoformat(application.get("applied_at")),
        "updated_at": isoformat(application.get("updated_at")),
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
        self.companies = self.db["companies"]
        self.jobs = self.db["jobs"]
        self.applications = self.db["applications"]
        self.counters = self.db["counters"]

    def ping(self):
        self.client.admin.command("ping")

    def ensure_indexes(self):
        self.users.create_index([("user_id", ASCENDING)], unique=True, name="uq_users_user_id")
        self.users.create_index([("email", ASCENDING)], unique=True, name="uq_users_email")
        self.companies.create_index([("company_id", ASCENDING)], unique=True, name="uq_companies_company_id")
        self.companies.create_index([("email", ASCENDING)], unique=True, name="uq_companies_email")
        self.jobs.create_index([("job_id", ASCENDING)], unique=True, name="uq_jobs_job_id")
        self.jobs.create_index([("company_id", ASCENDING), ("posted_date", DESCENDING)], name="ix_jobs_company_posted_date")
        self.jobs.create_index([("expiry_date", ASCENDING)], name="ix_jobs_expiry_date")
        self.applications.create_index([("application_id", ASCENDING)], unique=True, name="uq_applications_application_id")
        self.applications.create_index([("user_id", ASCENDING), ("job_id", ASCENDING)], unique=True, name="uq_applications_user_job")
        self.applications.create_index(
            [("company_id", ASCENDING), ("status", ASCENDING), ("applied_at", DESCENDING)],
            name="ix_applications_company_status",
        )

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
        self._bootstrapped = True

    def find_account_by_email(self, email):
        normalized = normalize_email(email)
        user = self.users.find_one({"email": normalized}, {"_id": 0})
        if user:
            return user
        return self.companies.find_one({"email": normalized}, {"_id": 0})

    def get_account(self, role, account_id):
        if account_id is None:
            return None
        if role == "company":
            return self.companies.find_one({"company_id": int(account_id)}, {"_id": 0})
        return self.users.find_one({"user_id": int(account_id)}, {"_id": 0})


def seed_database(store):
    if parse_bool(os.getenv("DISABLE_SEED_DATA"), default=False):
        return
    if store.jobs.count_documents({}) > 0:
        return

    now = utcnow()
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
        company_doc = {
            "company_id": store.next_sequence("companies"),
            "role": "company",
            "contact_name": company["contact_name"],
            "name": company["contact_name"],
            "email": normalize_email(company["email"]),
            "password_hash": generate_password_hash("password123"),
            "company_name": company["company_name"],
            "company_logo": company["company_logo"],
            "company_website": company["company_website"],
            "industry_type": company["industry_type"],
            "company_size": company["company_size"],
            "company_description": company["company_description"],
            "location": company["location"],
            "created_at": now,
            "updated_at": now,
        }
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
            {
                "job_id": store.next_sequence("jobs"),
                "company_id": company["company_id"],
                "job_title": job["title"],
                "job_description": job["description"],
                "experience_required": job["experience_level"],
                "education_required": job["degree_required"],
                "salary_min": salary_min,
                "salary_max": salary_max,
                "location": build_job_location(job),
                "employment_type": job["job_type"],
                "skills": job["required_skills"],
                "posted_date": posted_date,
                "expiry_date": expiry_date,
                "company_name": company["company_name"],
                "company_logo": company["company_logo"],
                "company_website": company["company_website"],
                "industry_type": company["industry_type"],
                "company_size": company["company_size"],
                "company_description": company["company_description"],
                "department": job["department"],
                "experience_level": job["experience_level"],
                "job_type": job["job_type"],
                "work_mode": job["work_mode"],
                "country": job["country"],
                "state": job["state"],
                "city": job["city"],
                "remote_option": job["work_mode"] == "remote",
                "degree_required": job["degree_required"],
                "required_skills": job["required_skills"],
                "description": job["description"],
                "role_overview": job["role_overview"],
                "responsibilities": job["responsibilities"],
                "required_qualifications": job["required_qualifications"],
                "preferred_qualifications": job["preferred_qualifications"],
                "requirements": job["required_qualifications"],
                "salary_range": job.get("salary_range"),
                "internship_stipend": job.get("internship_stipend"),
                "benefits": job.get("benefits"),
                "application_method": "platform",
                "application_url": "",
                "application_email": "",
                "resume_required": True,
                "portfolio_required": False,
                "cover_letter_required": False,
                "hiring_stages": ["Resume Screening", "Interview", "Offer"],
                "categories": job["categories"],
                "is_active": True,
                "created_at": posted_date,
                "updated_at": posted_date,
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
