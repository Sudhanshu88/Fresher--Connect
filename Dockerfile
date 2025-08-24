
FROM python:3.10-slim


ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1


RUN useradd -m -u 10001 appuser


WORKDIR /app




COPY Backend/requirements.txt ./requirements.txt
RUN pip install -r requirements.txt


COPY Backend/ ./


ENV FLASK_ENV=production \
    DATABASE_HOST=localhost \
    DATABASE_PORT=3306 \
    DATABASE_USER=root \
    DATABASE_PASSWORD=changeme \
    DATABASE_NAME=fresher_connect \
    SECRET_KEY=changeme


EXPOSE 5000

USER appuser


CMD ["python", "run.py"]
