from __future__ import annotations

import os

from backend.app import app, create_app


__all__ = ["app", "create_app"]


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")))
