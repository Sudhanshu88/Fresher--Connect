# syntax=docker/dockerfile:1.7

FROM python:3.11-slim AS backend-builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    VIRTUAL_ENV=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

RUN python -m venv "$VIRTUAL_ENV"

COPY backend/requirements.txt ./backend/requirements.txt

RUN pip install --upgrade pip \
    && pip install -r backend/requirements.txt


FROM python:3.11-slim AS backend

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    VIRTUAL_ENV=/opt/venv \
    PATH="/opt/venv/bin:$PATH" \
    PORT=5000

WORKDIR /app

COPY --from=backend-builder "$VIRTUAL_ENV" "$VIRTUAL_ENV"
COPY backend ./backend

RUN addgroup --system app \
    && adduser --system --ingroup app --home /app app \
    && mkdir -p /app/instance/uploads \
    && chown -R app:app /app "$VIRTUAL_ENV"

USER app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "from urllib.request import urlopen; urlopen('http://127.0.0.1:5000/healthz').read()"

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "4", "--access-logfile", "-", "--error-logfile", "-", "backend.wsgi:app"]


FROM node:20-alpine AS frontend-builder

ENV NODE_ENV=production

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./

RUN npm ci --include=dev

COPY frontend/app ./app
COPY frontend/components ./components
COPY frontend/lib ./lib
COPY frontend/public ./public
COPY frontend/next-env.d.ts ./next-env.d.ts
COPY frontend/next.config.ts ./next.config.ts
COPY frontend/tsconfig.json ./tsconfig.json

RUN npm run build


FROM node:20-alpine AS frontend

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

WORKDIR /app

COPY --from=frontend-builder /app/.next/standalone ./
COPY --from=frontend-builder /app/.next/static ./.next/static
COPY --from=frontend-builder /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:3000/index.html || exit 1
