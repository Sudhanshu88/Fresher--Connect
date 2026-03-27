# Fresher Connect

Fresher Connect is a fresher hiring platform with a Flask + MongoDB backend and a Next.js frontend runtime in `frontend/`. The live UI is served from `frontend/public/`, which holds the single static asset source used by the app.

Frontend and backend are now organized to be launched as separate servers with independent setup.

## Repository Structure

```text
Fresher--Connect
|-- backend
|   |-- config
|   |-- controllers
|   |-- middleware
|   |-- models
|   |-- routes
|   |-- services
|   |-- app.py
|   |-- server.py
|   |-- requirements.txt
|   `-- Dockerfile
|-- frontend
|   |-- app
|   |-- components
|   |-- lib
|   |-- public
|   |-- package.json
|   |-- .env.example
|   `-- Dockerfile
|-- database
|   |-- init.js
|   `-- schema.sql
|-- docker-compose.ec2.yml
|-- docker-compose.yml
|-- .github
|   `-- workflows
|       `-- cicd.yml
|-- scripts
`-- README.md
```

## Stack

- Frontend runtime: Next.js App Router + React + TypeScript + Zustand in `frontend/`
- UI asset source: static HTML, CSS, and JavaScript in `frontend/public/`
- Backend: Flask API with route, controller, middleware, and service layers in `backend/`
- Database: MongoDB collections, plus SQL reference schema in `database/schema.sql`
- Local verification mode: `mongomock`

## Local Setup

### Backend Server

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python server.py
```

Open:

- Backend: `http://127.0.0.1:5000`

Shortcut:

```powershell
powershell -File scripts/start-backend.ps1
```

### Frontend Server

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Open:

- Frontend: `http://127.0.0.1:3000`
- Backend API target: `http://127.0.0.1:5000`

Shortcut:

```powershell
powershell -File scripts/start-frontend.ps1
```

The `frontend/` app redirects route entries such as `/`, `/jobs`, `/login`, and `/company` to the `.html` pages inside `frontend/public/`, so the visual output remains the same as the earlier UI while keeping only one asset source.

## Environment Variables

Backend config lives in `backend/.env`.

```env
SESSION_COOKIE_SECURE=false
JWT_SECRET_KEY=change-this-before-production
MONGODB_URI=mongodb://127.0.0.1:27017/fresher_connect
MAX_CONTENT_LENGTH=2097152
FRONTEND_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
DISABLE_SEED_DATA=false
STORAGE_BACKEND=local
S3_BUCKET=
AWS_REGION=
S3_ENDPOINT_URL=
S3_PREFIX=uploads
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=240
RATE_LIMIT_WINDOW_SECONDS=60
AUTH_RATE_LIMIT_MAX=20
AUTH_RATE_LIMIT_WINDOW_SECONDS=300
```

Frontend config lives in `frontend/.env.local`.

```env
NEXT_PUBLIC_API_BASE=http://127.0.0.1:5000
```

Notes:

- The backend loads `backend/.env` first and falls back to the root `.env` only for backward compatibility
- Legacy static pages under `frontend/public/` can override the backend target with `?api=http://host:port` on first load
- If `MONGODB_URI` is not set, the backend defaults to `mongodb://127.0.0.1:27017/fresher_connect`
- Set `MONGODB_USE_MOCK=true` to run the backend against an in-memory mocked MongoDB
- Set `DISABLE_SEED_DATA=true` to skip sample companies and jobs
- Set `STORAGE_BACKEND=s3` with `S3_BUCKET` and `AWS_REGION` to store uploaded resumes in S3 instead of local disk

## Database

MongoDB init script:

```bash
mongosh --file database/init.js
```

Reference relational schema:

- `database/schema.sql`

## Docker

Shared Docker assets for combined local or legacy single-host runs:

- `docker-compose.yml`
- `docker-compose.ec2.yml`

Separate EC2 deployment files live in:

- `backend/docker-compose.yml`
- `frontend/docker-compose.yml`

Backend image:

```bash
cd backend
docker build -t fresher-connect-backend .
docker run -p 5000:5000 -e MONGODB_URI=mongodb://host.docker.internal:27017/fresher_connect fresher-connect-backend
```

Frontend image:

```bash
cd frontend
docker build -t fresher-connect-frontend .
docker run -p 3000:3000 fresher-connect-frontend
```

Frontend build:

```bash
cd frontend
npm install
copy .env.example .env.local
npm run build
```

Compose:

```bash
docker compose -f docker-compose.yml up --build
```

Docker assets target the `frontend/` runtime and the single asset source in `frontend/public/`.

## CI

GitHub Actions workflow:

- `.github/workflows/cicd.yml`

It verifies Python compilation, mocked backend flow, Docker Compose configuration, and container builds.

## Screenshots

### Dashboard

![Dashboard](docs/screenshots/dashboard-preview.svg)

### Job Apply Page

![Job Apply Page](docs/screenshots/job-apply-page-preview.svg)

### Company Panel

![Company Panel](docs/screenshots/company-panel-preview.svg)

## API Summary

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /jobs`
- `GET /jobs/:job_id`
- `POST /jobs`
- `POST /apply/:job_id`
- `GET /applications`
- `GET /api/session`
- `GET /api/user/dashboard`
- `PATCH /api/user/profile`
- `POST /api/user/resume`
- `GET /api/company/dashboard`
- `GET /api/company/jobs`
- `GET /api/company/applications`
- `POST /api/company/logo`
- `PATCH /api/company/applications/:application_id`
- `GET /api/uploads/:filename`
- `GET /healthz`

Legacy `/api/...` routes are still available for backward compatibility with the current frontend.
