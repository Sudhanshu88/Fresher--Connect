-- Reference relational schema aligned with the platform domain model.
-- Runtime storage uses MongoDB, but the same entities are represented there.

CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('candidate', 'company', 'admin')),
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE candidate_profiles (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    skills TEXT,
    education VARCHAR(160),
    experience VARCHAR(120),
    resume_url TEXT,
    linkedin TEXT,
    portfolio TEXT
);

CREATE TABLE companies (
    id BIGINT PRIMARY KEY,
    owner_user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(180) NOT NULL,
    website TEXT,
    location VARCHAR(160),
    description TEXT
);

CREATE TABLE jobs (
    id BIGINT PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    skills_required TEXT,
    salary_range VARCHAR(120),
    location VARCHAR(160),
    experience_required VARCHAR(120),
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE applications (
    id BIGINT PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    applied_at TIMESTAMP NOT NULL,
    UNIQUE (job_id, candidate_id)
);
