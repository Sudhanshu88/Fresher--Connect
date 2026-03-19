from __future__ import annotations


def build_company_document(
    *,
    company_id,
    owner_user_id,
    company_name,
    website,
    location,
    description,
    company_logo,
    industry_type,
    company_size,
    created_at,
    verification_status="verified",
    verification_updated_at=None,
):
    return {
        "id": company_id,
        "company_id": company_id,
        "owner_user_id": owner_user_id,
        "company_name": company_name,
        "website": website,
        "company_website": website,
        "location": location,
        "description": description,
        "company_description": description,
        "company_logo": company_logo,
        "industry_type": industry_type,
        "company_size": company_size,
        "verification_status": verification_status,
        "verification_updated_at": verification_updated_at or created_at,
        "created_at": created_at,
        "updated_at": created_at,
    }


def build_user_document(
    *,
    user_id,
    name,
    email,
    password_hash,
    role,
    created_at,
    is_active=True,
):
    return {
        "id": user_id,
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "role": role,
        "is_active": bool(is_active),
        "created_at": created_at,
        "updated_at": created_at,
    }


def build_candidate_profile_document(
    *,
    user_id,
    skills,
    education,
    experience,
    resume_url,
    linkedin,
    portfolio,
    location,
    phone,
    summary,
    grad_year,
    created_at,
):
    return {
        "user_id": user_id,
        "skills": skills,
        "education": education,
        "experience": experience,
        "resume_url": resume_url,
        "resume_filename": "",
        "resume_parser_status": "not_uploaded",
        "resume_text_excerpt": "",
        "resume_parsed_skills": [],
        "linkedin": linkedin,
        "portfolio": portfolio,
        "location": location,
        "phone": phone,
        "summary": summary,
        "grad_year": grad_year,
        "created_at": created_at,
        "updated_at": created_at,
    }


def merge_company_profile(company, payload, updated_at):
    updated = dict(company)
    website = str(payload.get("company_website") or payload.get("website") or company.get("website") or "").strip()
    description = str(
        payload.get("company_description") or payload.get("description") or company.get("description") or ""
    ).strip()
    updated.update(
        {
            "company_name": str(payload.get("company_name") or company.get("company_name") or "").strip(),
            "website": website,
            "company_website": website,
            "company_logo": str(payload.get("company_logo") or company.get("company_logo") or "").strip(),
            "industry_type": str(payload.get("industry_type") or company.get("industry_type") or "").strip(),
            "company_size": str(payload.get("company_size") or company.get("company_size") or "").strip(),
            "description": description,
            "company_description": description,
            "location": str(payload.get("location") or company.get("location") or "").strip(),
            "updated_at": updated_at,
        }
    )
    return updated


def build_job_document(
    *,
    job_id,
    company_doc,
    title,
    description,
    experience_required,
    education_required,
    salary_min,
    salary_max,
    location,
    employment_type,
    required_skills,
    posted_date,
    expiry_date,
    department,
    work_mode,
    country,
    state,
    city,
    remote_option,
    role_overview,
    responsibilities,
    required_qualifications,
    preferred_qualifications,
    salary_range,
    internship_stipend,
    benefits,
    application_method,
    application_url,
    application_email,
    resume_required,
    portfolio_required,
    cover_letter_required,
    hiring_stages,
    categories,
    created_at,
):
    canonical_salary_range = salary_range
    if not canonical_salary_range and salary_min is not None and salary_max is not None:
        canonical_salary_range = f"{salary_min} - {salary_max}"
    if not canonical_salary_range:
        canonical_salary_range = "Not disclosed"

    return {
        "id": job_id,
        "job_id": job_id,
        "company_id": company_doc["company_id"],
        "title": title,
        "job_title": title,
        "description": description,
        "job_description": description,
        "experience_required": experience_required,
        "education_required": education_required,
        "salary_min": salary_min,
        "salary_max": salary_max,
        "salary_range": canonical_salary_range,
        "location": location,
        "employment_type": employment_type,
        "skills_required": required_skills,
        "skills": required_skills,
        "created_at": created_at,
        "posted_date": posted_date,
        "expiry_date": expiry_date,
        "company_name": company_doc["company_name"],
        "company_logo": company_doc.get("company_logo"),
        "company_website": company_doc.get("company_website") or company_doc.get("website"),
        "industry_type": company_doc.get("industry_type"),
        "company_size": company_doc.get("company_size"),
        "company_description": company_doc.get("company_description") or company_doc.get("description"),
        "department": department,
        "experience_level": experience_required,
        "job_type": employment_type,
        "work_mode": work_mode,
        "country": country,
        "state": state,
        "city": city,
        "remote_option": remote_option,
        "degree_required": education_required,
        "required_skills": required_skills,
        "description": description,
        "role_overview": role_overview,
        "responsibilities": responsibilities,
        "required_qualifications": required_qualifications,
        "preferred_qualifications": preferred_qualifications,
        "requirements": required_qualifications,
        "internship_stipend": internship_stipend,
        "benefits": benefits,
        "application_method": application_method,
        "application_url": application_url,
        "application_email": application_email,
        "resume_required": resume_required,
        "portfolio_required": portfolio_required,
        "cover_letter_required": cover_letter_required,
        "hiring_stages": hiring_stages,
        "categories": categories,
        "is_active": True,
        "moderation_status": "approved",
        "created_at": created_at,
        "updated_at": created_at,
    }
