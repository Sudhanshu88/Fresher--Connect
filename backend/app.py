from __future__ import annotations

from flask import Flask

from backend.config.settings import load_runtime_settings
from backend.middleware.request_hooks import register_request_hooks
from backend.routes import register_routes
from backend.services.platform_service import MongoStore


def create_app():
    backend = Flask(__name__)
    backend.config.update(load_runtime_settings())
    backend.extensions["mongo_store"] = MongoStore(
        backend.config["FC_MONGODB_URI"],
        use_mock=backend.config["FC_USE_MOCK_DB"],
    )
    register_request_hooks(backend)
    register_routes(backend)
    return backend


app = create_app()
