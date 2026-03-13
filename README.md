# FresherConnect

FresherConnect is split into a static frontend and a Flask backend API. The runtime data store is MongoDB, with separate collections for freshers, companies, jobs, applications, and counters.

## Stack

- Frontend: static HTML/CSS/JS from `frontend/`
- Backend: Flask API from `backend/app.py`
- Database: MongoDB
- Local verification mode: `mongomock`

## Local setup

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

## Environment variables

Copy `.env.example` to `.env` if you use one, then set values as needed.

```env
SECRET_KEY=change-this-before-production
SESSION_COOKIE_SECURE=false
MONGODB_URI=mongodb://127.0.0.1:27017/fresher_connect
MAX_CONTENT_LENGTH=2097152
FRONTEND_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
DISABLE_SEED_DATA=false
```

Notes:

- If `MONGODB_URI` is not set, the backend defaults to `mongodb://127.0.0.1:27017/fresher_connect`.
- Set `MONGODB_USE_MOCK=true` when you want to run the backend against an in-memory mocked MongoDB for local verification.
- Set `DISABLE_SEED_DATA=true` to skip the sample companies and sample jobs.

## MongoDB schema init

A MongoDB init script is available at `mongodb/init.js`.

```bash
mongosh --file mongodb/init.js
```

It prepares:

- `users`
- `companies`
- `jobs`
- `applications`
- `counters`

## Docker

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

Docker Compose:

```bash
docker compose up --build
```

Compose starts:

- `mongodb` on `27017`
- `backend` on `5000`
- `frontend` on `3000`

## API summary

- `GET /api/session`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/jobs`
- `GET /api/user/dashboard`
- `PATCH /api/user/profile`
- `POST /api/applications`
- `GET /api/applications/me`
- `GET /api/company/dashboard`
- `GET /api/company/jobs`
- `POST /api/company/jobs`
- `GET /api/company/applications`
- `PATCH /api/company/applications/:application_id`
- `GET /healthz`

## Production notes

- Use a strong `SECRET_KEY`
- Use a managed MongoDB deployment for production
- Restrict `FRONTEND_ORIGINS` to trusted frontend hosts
- Serve behind HTTPS and set `SESSION_COOKIE_SECURE=true`
