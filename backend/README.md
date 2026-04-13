# Backend

This folder is the canonical backend source.

## Run Locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python server.py
```

Backend server default:

- `http://127.0.0.1:5000`

The backend loads configuration from `backend/.env` first and falls back to the legacy root `.env` only if needed.
The local example file uses a localhost MongoDB URI for native development outside Docker.

## Deploy On Separate EC2

Use the files in this folder when the backend runs on its own EC2 instance:

- `docker-compose.yml`
- `.env.ec2.example`

Typical production flow:

```bash
cd backend
cp .env.ec2.example .env
nano .env
docker compose up -d --build
```

Before starting the container, set a real `MONGODB_URI` in `backend/.env` and keep `FRONTEND_ORIGINS` aligned with the frontend domain.
Do not commit production secrets into the repository.
Never deploy with `MONGODB_USE_MOCK=true`; `mongomock` is in-memory only, so companies, reviews, and other live writes disappear on restart or redeploy.

Quick verification after deploy:

```bash
docker compose exec backend python -c "from backend.config.settings import normalize_mongodb_uri; print(normalize_mongodb_uri())"
curl http://127.0.0.1:5000/healthz
```

If the first command prints `mongodb://127.0.0.1:27017/fresher_connect` inside Docker, the container is not receiving the intended `MONGODB_URI`. Fix the Compose `.env` used at startup before trusting a successful health response.
If `/healthz` reports `"engine":"mongomock"` or `"mode":"mock"`, the server is not using a persistent MongoDB instance.
