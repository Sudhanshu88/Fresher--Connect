from __future__ import annotations

import os
import re
import zipfile
from typing import Iterable


KNOWN_SKILLS = [
    "Python",
    "Java",
    "JavaScript",
    "TypeScript",
    "C",
    "C++",
    "C#",
    "SQL",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "HTML",
    "CSS",
    "React",
    "Next.js",
    "Node.js",
    "Express",
    "Flask",
    "Django",
    "FastAPI",
    "REST API",
    "GraphQL",
    "Git",
    "GitHub",
    "Linux",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "CI/CD",
    "Jenkins",
    "Terraform",
    "Ansible",
    "Shell Scripting",
    "Bash",
    "PowerShell",
    "Prometheus",
    "Grafana",
    "ELK",
    "DevOps",
    "Data Analysis",
    "Excel",
    "Tableau",
    "Power BI",
    "Machine Learning",
    "Pandas",
    "NumPy",
    "Communication",
    "Documentation",
    "Coordination",
    "Meta Ads",
    "Google Ads",
    "Reporting",
    "Dashboards",
    "APIs",
]


SKILL_ALIASES = {
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "nextjs": "Next.js",
    "ci cd": "CI/CD",
    "cicd": "CI/CD",
    "rest api": "REST API",
    "rest apis": "REST API",
    "powerbi": "Power BI",
    "googleads": "Google Ads",
    "metaads": "Meta Ads",
    "shell scripting": "Shell Scripting",
}


def normalize_skill_key(value):
    text = re.sub(r"[^a-z0-9+#./ ]+", " ", str(value or "").strip().lower())
    return re.sub(r"\s+", " ", text).strip()


def canonical_skill_label(value):
    normalized = normalize_skill_key(value)
    if not normalized:
        return ""
    if normalized in SKILL_ALIASES:
        return SKILL_ALIASES[normalized]
    for skill in KNOWN_SKILLS:
        if normalize_skill_key(skill) == normalized:
            return skill
    return str(value or "").strip()


def merge_skill_lists(*skill_lists: Iterable[str]):
    result = []
    seen = set()
    for skill_list in skill_lists:
        for item in skill_list or []:
            label = canonical_skill_label(item)
            if not label:
                continue
            key = normalize_skill_key(label)
            if key in seen:
                continue
            seen.add(key)
            result.append(label)
    return result


def _extract_pdf_text(path):
    try:
        from pypdf import PdfReader  # type: ignore
    except Exception:
        return ""

    try:
        reader = PdfReader(path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        return ""


def _extract_docx_text(path):
    try:
        with zipfile.ZipFile(path) as archive:
            xml = archive.read("word/document.xml").decode("utf-8", errors="ignore")
    except Exception:
        return ""
    text = re.sub(r"<[^>]+>", " ", xml)
    return re.sub(r"\s+", " ", text).strip()


def _extract_plain_text(path):
    try:
        with open(path, "rb") as handle:
            raw = handle.read()
    except OSError:
        return ""

    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="ignore")


def extract_resume_text(path):
    extension = os.path.splitext(path)[1].lower()
    text = ""
    parser_status = "unavailable"

    if extension == ".pdf":
        text = _extract_pdf_text(path)
        if text:
            parser_status = "parsed"
        else:
            text = _extract_plain_text(path)
            parser_status = "fallback" if text else "unavailable"
    elif extension == ".docx":
        text = _extract_docx_text(path)
        if text:
            parser_status = "parsed"
        else:
            text = _extract_plain_text(path)
            parser_status = "fallback" if text else "unavailable"
    else:
        text = _extract_plain_text(path)
        parser_status = "parsed" if text else "unavailable"

    cleaned = re.sub(r"\s+", " ", str(text or "")).strip()
    return {"text": cleaned, "parser_status": parser_status if cleaned else "unavailable"}


def extract_skills_from_text(text):
    haystack = " " + normalize_skill_key(text) + " "
    matches = []
    for skill in KNOWN_SKILLS:
        key = normalize_skill_key(skill)
        if not key:
            continue
        if re.search(rf"(?<!\w){re.escape(key)}(?!\w)", haystack):
            matches.append(skill)
    return merge_skill_lists(matches)


def parse_resume_file(path):
    payload = extract_resume_text(path)
    text = payload["text"]
    skills = extract_skills_from_text(text)
    excerpt = text[:280] if text else ""
    return {
        "text": text,
        "excerpt": excerpt,
        "skills": skills,
        "parser_status": payload["parser_status"],
    }
