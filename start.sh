#!/usr/bin/env bash

set -euo pipefail

BACKEND_BIND_HOST="${BACKEND_BIND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-5000}"

mkdir -p /app/instance/uploads

gunicorn \
  --chdir /app \
  --bind "${BACKEND_BIND_HOST}:${BACKEND_PORT}" \
  --workers "${GUNICORN_WORKERS:-2}" \
  --threads "${GUNICORN_THREADS:-4}" \
  --access-logfile - \
  --error-logfile - \
  backend.wsgi:app &
backend_pid=$!

frontend_pid=""

cleanup() {
  if [[ -n "${frontend_pid}" ]] && kill -0 "${frontend_pid}" 2>/dev/null; then
    kill "${frontend_pid}" 2>/dev/null || true
  fi

  if kill -0 "${backend_pid}" 2>/dev/null; then
    kill "${backend_pid}" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

cd /app/frontend
node server.js &
frontend_pid=$!

wait -n "${backend_pid}" "${frontend_pid}"
exit_code=$?

cleanup

wait "${backend_pid}" 2>/dev/null || true
wait "${frontend_pid}" 2>/dev/null || true

exit "${exit_code}"
