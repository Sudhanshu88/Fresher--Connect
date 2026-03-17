from __future__ import annotations

from collections import defaultdict, deque
from threading import Lock
from time import time


_REQUEST_BUCKETS = defaultdict(deque)
_REQUEST_BUCKETS_LOCK = Lock()


def _client_ip(request):
    forwarded = str(request.headers.get("X-Forwarded-For") or "").split(",", 1)[0].strip()
    return forwarded or request.remote_addr or "unknown"


def _rate_limit_rule(config, path):
    if path.startswith("/auth/"):
        return {
            "scope": "auth",
            "max_requests": int(config.get("FC_AUTH_RATE_LIMIT_MAX", 20)),
            "window_seconds": int(config.get("FC_AUTH_RATE_LIMIT_WINDOW", 300)),
        }
    return {
        "scope": "default",
        "max_requests": int(config.get("FC_RATE_LIMIT_MAX", 240)),
        "window_seconds": int(config.get("FC_RATE_LIMIT_WINDOW", 60)),
    }


def check_rate_limit(config, request):
    if not config.get("FC_RATE_LIMIT_ENABLED", True):
        return {"allowed": True}
    if request.method == "OPTIONS" or request.path in {"/", "/healthz"}:
        return {"allowed": True}

    rule = _rate_limit_rule(config, request.path)
    max_requests = max(0, int(rule["max_requests"]))
    window_seconds = max(0, int(rule["window_seconds"]))
    if max_requests == 0 or window_seconds == 0:
        return {"allowed": True}

    current_time = time()
    bucket_key = rule["scope"] + ":" + _client_ip(request)

    with _REQUEST_BUCKETS_LOCK:
        bucket = _REQUEST_BUCKETS[bucket_key]
        cutoff = current_time - window_seconds
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()

        if len(bucket) >= max_requests:
            retry_after = max(1, int(window_seconds - (current_time - bucket[0])))
            return {
                "allowed": False,
                "retry_after": retry_after,
                "limit": max_requests,
                "window_seconds": window_seconds,
            }

        bucket.append(current_time)
        return {
            "allowed": True,
            "remaining": max(0, max_requests - len(bucket)),
            "limit": max_requests,
            "window_seconds": window_seconds,
        }
