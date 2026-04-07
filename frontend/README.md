This folder is the canonical frontend source.

The active runtime, build configuration, and shared public assets all live here.

## Run Locally

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Frontend server default:

- `http://127.0.0.1:3000`

Backend defaults:

- `http://127.0.0.1:5000`

Set `NEXT_PUBLIC_API_BASE` in `frontend/.env.local` if the browser can reach the backend directly on another host or port.
Set `API_PROXY_TARGET` in `frontend/.env.local` for the Next.js `/api/*` rewrite target, especially when the frontend is served over HTTPS and the backend is only reachable over HTTP.
## Deploy On Separate EC2

Use the files in this folder when the frontend runs on its own EC2 instance:

- `docker-compose.yml`
- `.env.ec2.example`

Typical production flow:

```bash
cd frontend
cp .env.ec2.example .env
docker compose up -d --build
```

Set `API_PROXY_TARGET` to the backend EC2 private IP or internal load balancer URL. Leave `NEXT_PUBLIC_API_BASE` empty if you want the browser to keep using the frontend origin and let Next.js proxy `/api/*` requests server-side.
