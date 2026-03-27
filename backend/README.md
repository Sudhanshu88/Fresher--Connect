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

## Deploy On Separate EC2

Use the files in this folder when the backend runs on its own EC2 instance:

- `docker-compose.yml`
- `.env.ec2.example`

Typical production flow:

```bash
cd backend
cp .env.ec2.example .env
docker compose up -d --build
```

Set `MONGODB_URI` to the real database endpoint and keep `FRONTEND_ORIGINS` aligned with the frontend EC2 public URL or domain.
