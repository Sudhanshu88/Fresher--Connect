from __future__ import annotations

import os

from flask import Flask

from backend.config.settings import load_runtime_settings
from backend.middleware.request_hooks import register_request_hooks
from backend.routes import register_routes
from backend.services.platform_service import MongoStore


def create_app():
    backend = Flask(__name__)
    backend.config.update(load_runtime_settings())
    if backend.config["FC_USE_MOCK_DB"] and backend.config["FC_PRODUCTION_LIKE_RUNTIME"]:
        raise RuntimeError("mock_db_not_allowed_in_production_like_runtime")
    upload_folder = os.path.join(backend.instance_path, "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    backend.config["UPLOAD_FOLDER"] = upload_folder
    backend.extensions["mongo_store"] = MongoStore(
        backend.config["FC_MONGODB_URI"],
        use_mock=backend.config["FC_USE_MOCK_DB"],
    )
    register_request_hooks(backend)
    register_routes(backend)
    return backend


app = create_app()
