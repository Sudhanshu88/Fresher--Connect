# Fresher Connect

Fresher Connect is a split frontend and backend hiring platform for freshers and recruiters. The frontend is a static app, the backend is a Flask API, and MongoDB stores users, companies, jobs, and applications.

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
|   `-- Dockerfile.backend
|-- frontend
|   |-- components
|   |-- pages
|   |-- services
|   |-- styles
|   |-- index.html
|   `-- Dockerfile.frontend
|-- database
|   |-- init.js
|   `-- schema.sql
|-- docker
|   |-- Dockerfile
|   `-- docker-compose.yml
|-- .github
|   `-- workflows
|       `-- ci.yml
|-- scripts
|-- app.py
`-- requirements.txt
```

## Stack

- Frontend: static HTML, CSS, and JavaScript in `frontend/pages`, `frontend/styles`, and `frontend/services`
- Backend: Flask API with route, controller, middleware, and service layers in `backend/`
- Database: MongoDB collections, plus SQL reference schema in `database/schema.sql`
- Local verification mode: `mongomock`

## Local Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
python -m http.server 3000 -d frontend
```

Open:

- Frontend: `http://127.0.0.1:3000/?api=http://127.0.0.1:5000`
- Backend: `http://127.0.0.1:5000`

Root HTML files in `frontend/` are compatibility redirects. Main page implementations live in `frontend/pages/`.

## Environment Variables

Copy `.env.example` to `.env` if needed.

```env
SESSION_COOKIE_SECURE=false
JWT_SECRET_KEY=change-this-before-production
MONGODB_URI=mongodb://127.0.0.1:27017/fresher_connect
MAX_CONTENT_LENGTH=2097152
FRONTEND_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
DISABLE_SEED_DATA=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=240
RATE_LIMIT_WINDOW_SECONDS=60
AUTH_RATE_LIMIT_MAX=20
AUTH_RATE_LIMIT_WINDOW_SECONDS=300
```

Notes:

- If `MONGODB_URI` is not set, the backend defaults to `mongodb://127.0.0.1:27017/fresher_connect`
- Set `MONGODB_USE_MOCK=true` to run the backend against an in-memory mocked MongoDB
- Set `DISABLE_SEED_DATA=true` to skip sample companies and jobs

## Database

MongoDB init script:

```bash
mongosh --file database/init.js
```

Reference relational schema:

- `database/schema.sql`

## Docker

Shared Docker assets:

- `docker/Dockerfile`
- `docker/docker-compose.yml`

Backend image:

```bash
docker build -f backend/Dockerfile.backend -t fresher-connect-backend .
docker run -p 5000:5000 -e MONGODB_URI=mongodb://host.docker.internal:27017/fresher_connect fresher-connect-backend
```

Frontend image:

```bash
docker build -f frontend/Dockerfile.frontend -t fresher-connect-frontend .
docker run -p 3000:80 fresher-connect-frontend
```

Compose:

```bash
docker compose -f docker/docker-compose.yml up --build
```

## CI

GitHub Actions workflow:

- `.github/workflows/ci.yml`

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
- `PATCH /api/company/applications/:application_id`
- `GET /healthz`

Legacy `/api/...` routes are still available for backward compatibility with the current frontend.
