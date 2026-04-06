# syntax=docker/dockerfile:1.7

FROM python:3.11-slim-bookworm AS backend-builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    VIRTUAL_ENV=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app/backend

RUN python -m venv "$VIRTUAL_ENV"

COPY backend/requirements.txt ./requirements.txt

RUN pip install --upgrade pip \
    && pip install -r requirements.txt


FROM node:20-bookworm-slim AS frontend-builder

ARG NEXT_PUBLIC_API_BASE=
ARG API_PROXY_TARGET=http://127.0.0.1:5000

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE \
    API_PROXY_TARGET=$API_PROXY_TARGET

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./

RUN npm ci --include=dev

COPY frontend ./

RUN npm run build


FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    BACKEND_PORT=5000 \
    NEXT_PUBLIC_API_BASE= \
    API_PROXY_TARGET=http://127.0.0.1:5000 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    VIRTUAL_ENV=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 ca-certificates \
    && mkdir -p /usr/local/bin \
    && ln -sf /usr/bin/python3 /usr/local/bin/python \
    && ln -sf /usr/bin/python3 /usr/local/bin/python3 \
    && ln -sf /usr/bin/python3 /usr/local/bin/python3.11 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-builder /opt/venv /opt/venv
COPY backend ./backend
COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY start.sh ./start.sh

RUN chmod +x /app/start.sh \
    && addgroup --system app \
    && adduser --system --ingroup app --home /app app \
    && mkdir -p /app/instance/uploads \
    && chown -R app:app /app "$VIRTUAL_ENV"

USER app

EXPOSE 3000

CMD ["./start.sh"]
