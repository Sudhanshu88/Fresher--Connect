from __future__ import annotations

from backend.services.resume_service import canonical_skill_label, merge_skill_lists, normalize_skill_key


def candidate_skill_inventory(candidate):
    return merge_skill_lists(
        candidate.get("skills") or [],
        candidate.get("resume_parsed_skills") or [],
    )


def match_candidate_to_job(candidate, job):
    required_skills = merge_skill_lists(job.get("required_skills") or job.get("skills_required") or [])
    candidate_skills = candidate_skill_inventory(candidate)
    if not required_skills:
        return {
            "match_score": 0,
            "match_label": "Not enough data",
            "matched_skills": [],
            "missing_skills": [],
            "candidate_skills": candidate_skills,
            "match_reason": "Job skills are not available yet.",
        }

    candidate_keys = {normalize_skill_key(skill) for skill in candidate_skills}
    matched_skills = [canonical_skill_label(skill) for skill in required_skills if normalize_skill_key(skill) in candidate_keys]
    missing_skills = [canonical_skill_label(skill) for skill in required_skills if normalize_skill_key(skill) not in candidate_keys]
    match_score = int(round((len(matched_skills) / max(len(required_skills), 1)) * 100))
    if match_score >= 75:
        match_label = "Strong match"
    elif match_score >= 45:
        match_label = "Moderate match"
    elif match_score > 0:
        match_label = "Early match"
    else:
        match_label = "Low match"

    return {
        "match_score": match_score,
        "match_label": match_label,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "candidate_skills": candidate_skills,
        "match_reason": (
            f"Matched {len(matched_skills)} of {len(required_skills)} required skills."
            if required_skills
            else "Match data is not available."
        ),
    }


def attach_job_match(candidate, job):
    match = match_candidate_to_job(candidate, job)
    enriched = dict(job)
    enriched.update(match)
    return enriched
