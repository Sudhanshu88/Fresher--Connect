from __future__ import annotations

import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import create_app
from backend.services.workflow_service import process_application_sla


def main():
    app = create_app()
    with app.app_context():
        store = app.extensions["mongo_store"]
        store.bootstrap()
        result = process_application_sla(store)

    expired_ids = ",".join(str(item) for item in result["expired_application_ids"]) or "-"
    print(
        "application_sla_processed="
        + str(result["processed"])
        + " expired_application_ids="
        + expired_ids
        + " sla_days="
        + str(result["sla_days"])
    )


if __name__ == "__main__":
    main()
