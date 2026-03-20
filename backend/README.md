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
