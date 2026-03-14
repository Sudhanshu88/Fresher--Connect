-- Reference relational schema for documentation and migrations.
-- Runtime data storage still uses MongoDB collections.

CREATE TABLE users (
    user_id BIGINT PRIMARY KEY,
    role VARCHAR(20) NOT NULL DEFAULT 'fresher',
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone VARCHAR(32),
    location VARCHAR(120),
    education VARCHAR(120),
    grad_year INT,
    skills TEXT,
    summary TEXT,
    resume_path TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE companies (
    company_id BIGINT PRIMARY KEY,
    role VARCHAR(20) NOT NULL DEFAULT 'company',
    contact_name VARCHAR(120) NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    company_name VARCHAR(160) NOT NULL,
    company_logo TEXT,
    company_website TEXT,
    industry_type VARCHAR(120),
    company_size VARCHAR(64),
    company_description TEXT,
    location VARCHAR(120),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE jobs (
    job_id BIGINT PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(company_id),
    job_title VARCHAR(180) NOT NULL,
    job_description TEXT NOT NULL,
    experience_required VARCHAR(120),
    education_required VARCHAR(120),
    salary_min INT,
    salary_max INT,
    location VARCHAR(180),
    employment_type VARCHAR(64),
    skills TEXT,
    posted_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP,
    department VARCHAR(120),
    work_mode VARCHAR(32),
    country VARCHAR(80),
    state VARCHAR(80),
    city VARCHAR(80),
    remote_option BOOLEAN NOT NULL DEFAULT FALSE,
    application_method VARCHAR(32),
    application_url TEXT,
    application_email TEXT,
    resume_required BOOLEAN NOT NULL DEFAULT TRUE,
    portfolio_required BOOLEAN NOT NULL DEFAULT FALSE,
    cover_letter_required BOOLEAN NOT NULL DEFAULT FALSE,
    hiring_stages TEXT,
    categories TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE applications (
    application_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    company_id BIGINT NOT NULL REFERENCES companies(company_id),
    job_id BIGINT NOT NULL REFERENCES jobs(job_id),
    status VARCHAR(32) NOT NULL,
    applied_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE (user_id, job_id)
);
