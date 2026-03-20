This folder is the canonical frontend source.

The active runtime, build configuration, and public UI assets all live here.

## Run Locally

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Frontend server default:

- `http://127.0.0.1:3000`

Set `NEXT_PUBLIC_API_BASE` in `frontend/.env.local` if the backend runs on a different host or port.
Legacy static pages in `frontend/public/` can also be pointed at another backend with `?api=http://host:port` on first load.
