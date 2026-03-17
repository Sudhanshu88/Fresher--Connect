from __future__ import annotations

import mimetypes
import os
import shutil
from pathlib import Path
from urllib.parse import quote

from flask import current_app

try:  # pragma: no cover - optional dependency in local fallback mode
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except ImportError:  # pragma: no cover
    boto3 = None
    BotoCoreError = ClientError = Exception


def storage_backend(config=None):
    app_config = config or current_app.config
    backend = str(app_config.get("FC_STORAGE_BACKEND") or "local").strip().lower()
    return backend if backend == "s3" else "local"


def storage_key(*parts, config=None):
    app_config = config or current_app.config
    prefix = ""
    if storage_backend(app_config) == "s3":
        prefix = str(app_config.get("FC_S3_PREFIX") or "").strip().strip("/")
    segments = [segment.strip("/") for segment in [prefix, *parts] if str(segment or "").strip("/")]
    return "/".join(segments)


def upload_path_for_key(key, config=None):
    app_config = config or current_app.config
    base = Path(app_config["UPLOAD_FOLDER"])
    return base.joinpath(*str(key or "").split("/"))


def _s3_client(config=None):
    app_config = config or current_app.config
    if boto3 is None:
        raise RuntimeError("s3_dependency_missing")
    return boto3.client(
        "s3",
        region_name=str(app_config.get("FC_S3_REGION") or "").strip() or None,
        endpoint_url=str(app_config.get("FC_S3_ENDPOINT_URL") or "").strip() or None,
    )


def _s3_bucket(config=None):
    app_config = config or current_app.config
    bucket = str(app_config.get("FC_S3_BUCKET") or "").strip()
    if not bucket:
        raise RuntimeError("s3_bucket_not_configured")
    return bucket


def store_file(source_path, key, *, content_type=None, config=None):
    app_config = config or current_app.config
    backend = storage_backend(app_config)

    if backend == "s3":
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
        try:
            with open(source_path, "rb") as handle:
                _s3_client(app_config).upload_fileobj(
                    handle,
                    _s3_bucket(app_config),
                    key,
                    ExtraArgs=extra_args or None,
                )
        except (OSError, BotoCoreError, ClientError) as error:
            raise RuntimeError("storage_upload_failed") from error
        return {"storage_backend": "s3", "storage_key": key}

    destination = upload_path_for_key(key, app_config)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if Path(source_path).resolve() != destination.resolve():
        shutil.move(source_path, destination)
    return {"storage_backend": "local", "storage_key": key}


def build_upload_url(key, request_root):
    return request_root.rstrip("/") + "/api/uploads/" + quote(str(key or ""))


def open_upload(key, config=None):
    app_config = config or current_app.config
    backend = storage_backend(app_config)

    if backend == "s3":
        try:
            response = _s3_client(app_config).get_object(Bucket=_s3_bucket(app_config), Key=key)
        except ClientError:
            return None
        body = response["Body"].read()
        return {
            "body": body,
            "content_type": response.get("ContentType") or "application/octet-stream",
            "filename": Path(str(key or "")).name or "download",
        }

    path = upload_path_for_key(key, app_config)
    if not path.exists():
        return None
    return {
        "path": str(path),
        "content_type": mimetypes.guess_type(path.name)[0] or "application/octet-stream",
        "filename": path.name,
    }
