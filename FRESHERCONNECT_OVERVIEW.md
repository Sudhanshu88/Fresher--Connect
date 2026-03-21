# FresherConnect Overview

FresherConnect ek fresher hiring platform hai jahan 3 main user roles kaam karte hain:

- `Fresher / Candidate`
- `Company / Recruiter`
- `Admin`

Is project ka purpose hai hiring process ko simple banana: job discover karo, apply karo, application track karo, aur company side se candidates manage karo.

![FresherConnect Logo](frontend/public/fc-logo.svg)

## Product Photos

### 1. Candidate Dashboard

![Candidate Dashboard](docs/screenshots/dashboard-preview.svg)

Ye screen candidate ko jobs, saved jobs, applications aur notifications ek jagah dikhati hai.

### 2. Job Apply Flow

![Job Apply Page](docs/screenshots/job-apply-page-preview.svg)

Ye screen job details, eligibility, skills aur application action ko explain karti hai.

### 3. Company Panel

![Company Panel](docs/screenshots/company-panel-preview.svg)

Ye screen recruiter/company ko posted jobs, candidate applications, analytics aur activity track karne me help karti hai.

## FresherConnect Ke Main Features

### 1. Public Features

- Home page jahan platform intro aur user reviews/testimonials dikhte hain.
- Public jobs listing page jahan jobs browse ki ja sakti hain.
- Job detail page jahan company, role, skills, location aur compensation details milti hain.
- Search, category, location, company, experience, skills aur salary based filtering.
- Pagination support, taaki large job list easily manage ho.

### 2. Fresher / Candidate Features

- Fresher registration aur login.
- Profile update: name, education, grad year, phone, location, skills, portfolio, LinkedIn, summary.
- Resume upload.
- Resume parsing aur skills extraction.
- Recommended jobs with match insight.
- Job apply karna.
- Applied jobs ko dashboard me track karna.
- Saved jobs list maintain karna.
- Notifications dekhna aur mark as read karna.
- Application status track karna, jaise `applied`, `reviewing`, `shortlisted`, `interview`, `offered`, `rejected`.

### 3. Company / Recruiter Features

- Company login.
- Company profile and logo upload.
- New job create karna.
- Job fields manage karna:
  title, description, experience, education, work mode, salary, skills, benefits, hiring stages, application method.
- Apni posted jobs dekhna.
- Candidates ki application list dekhna.
- Candidate-job match score/fit dekhna.
- Candidate application status update karna.
- Interview timing aur decision reason maintain karna.
- Company analytics dekhna.
- Recent activity / audit trail dekhna.
- Overdue applications track karna.

### 4. Admin Features

- Admin login.
- Full dashboard with analytics.
- All users dekhna.
- Company verification status manage karna.
- Jobs moderate karna:
  `approved`, `pending`, `rejected`
- Public visibility control karna.
- System-wide recent activity track karna.

### 5. System / Platform Features

- Role-based access control.
- JWT-based authentication.
- Password hashing.
- MongoDB-based storage.
- Mock database mode for local testing.
- Rate limiting for security.
- In-app notifications.
- Optional email notification flow.
- Audit logging.
- File storage abstraction:
  local storage ya S3 storage dono support.
- Health check endpoint.
- Docker-based deployment support.
- GitHub Actions CI verification support.

## Kaunsi Language / Technology Use Hui Hai Aur Kyu

## 1. TypeScript

**Kahan use hui hai:** `frontend/app`, `frontend/components`, `frontend/lib`

**Kyu use hui hai:**

- React frontend ko type-safe banane ke liye
- Compile time par errors pakadne ke liye
- Large project me maintainability aur scalability better rakhne ke liye
- State shape, API response aur UI props ko clearly define karne ke liye

**Example kaam:**

- React pages
- reusable components
- Redux Toolkit slices
- API helpers
- route helpers

## 2. JavaScript

**Kahan use hui hai:** `frontend/public/services`, `database/init.js`

**Kyu use hui hai:**

- Legacy static frontend logic ko support karne ke liye
- MongoDB seed / init script chalane ke liye
- Backward compatibility maintain karne ke liye

**Example kaam:**

- old HTML pages ka browser logic
- MongoDB initial data setup

## 3. Python

**Kahan use hui hai:** `backend/`

**Kyu use hui hai:**

- Backend API banane ke liye
- Business logic handle karne ke liye
- Authentication, notifications, matching, analytics, audit aur workflow process karne ke liye

**Example kaam:**

- Flask routes and controllers
- MongoDB access
- resume parsing
- job matching
- rate limiting
- file upload handling

## 4. HTML

**Kahan use hui hai:** `frontend/public/*.html`

**Kyu use hui hai:**

- Legacy static pages ke structure ke liye
- Simple browser-rendered screens ke liye
- Earlier UI compatibility maintain rakhne ke liye

## 5. CSS

**Kahan use hui hai:** `frontend/app/globals.css`, `frontend/public/styles/app.css`

**Kyu use hui hai:**

- UI styling ke liye
- layout, colors, typography aur responsiveness ke liye
- React UI aur static UI dono ko consistent look dene ke liye

## 6. SQL

**Kahan use hui hai:** `database/schema.sql`

**Kyu use hui hai:**

- Reference relational schema dikhane ke liye
- Database design samjhane ke liye
- Future migration/documentation support ke liye

Note: runtime database MongoDB hai, lekin SQL file documentation/reference ke kaam aati hai.

## 7. PowerShell

**Kahan use hui hai:** `scripts/*.ps1`

**Kyu use hui hai:**

- Local development start karne ke liye
- backend/frontend launch scripts dene ke liye
- developer workflow ko fast banane ke liye

## 8. Dockerfile / YAML

**Kahan use hui hai:** `docker/`, `backend/Dockerfile`, `frontend/Dockerfile`

**Kyu use hui hai:**

- App ko container me run karne ke liye
- Deployment aur environment setup easy banane ke liye
- Same environment me frontend aur backend run karne ke liye

## Major Frameworks Aur Tools

### React

Frontend UI ko reusable components me break karne ke liye use hua hai.

### Next.js

React app ko route-based structure, build system aur frontend runtime dene ke liye use hua hai.

### Redux Toolkit

Global state management ke liye use hua hai, jaise:

- user session
- notifications
- job data
- applications
- dashboards

### Flask

Python backend API framework ke roop me use hua hai.

### MongoDB

Main database ke roop me use hua hai, kyunki job platform jaisa data flexible documents me easily store hota hai.

### PyMongo

Python se MongoDB connect aur query karne ke liye use hua hai.

### bcrypt

Passwords secure hash karne ke liye use hua hai.

### JWT

User authentication tokens issue aur verify karne ke liye use hua hai.

### boto3

S3 storage support ke liye use hua hai.

## Project Structure Simple Words Me

- `frontend/`
  React + Next.js based frontend
- `backend/`
  Flask API, business logic, services
- `database/`
  schema aur initialization files
- `docs/screenshots/`
  product photos / preview images
- `scripts/`
  local run aur utility scripts
- `docker/`
  deployment/container setup

## Short Demo Explanation

Aap agar kisi ko short me explain karna chaho to ye line use kar sakte ho:

> FresherConnect ek fresher hiring platform hai jo React/Next.js frontend aur Python Flask backend par bana hai. Isme candidates jobs search aur apply kar sakte hain, companies jobs post karke applications manage kar sakti hain, aur admin poore platform ko monitor aur moderate kar sakta hai.

## Best One-Line Summary

FresherConnect ek full-stack hiring platform hai jo fresher job search, company recruitment workflow, aur admin moderation ko ek hi system me handle karta hai.
