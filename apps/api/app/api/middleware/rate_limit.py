"""
Sliding-window in-memory rate limiter for the OAuth endpoints.

WHY THIS EXISTS
---------------
The /auth/login and /auth/callback endpoints are the primary attack surface for:

  1. Slug enumeration — probing /auth/login?slug=guess to discover valid slugs.
     Even though we no longer return 404 for unknown slugs (see auth service),
     an attacker could still time responses or observe any behavioral difference.
     Rate limiting makes automated probing impractical: at 20 req/min, exhausting
     a 6-char alphanumeric space (36^6 ≈ 2 billion) would take 190+ years.

  2. PKCE state table flooding — each /login call inserts a row into oauth_states.
     Without rate limiting, an attacker could fill the table with junk rows.

  3. Parallel OAuth code replay attempts — rate limiting /callback prevents an
     attacker from simultaneously trying to submit the same authorization code
     from multiple machines.

WHY IN-MEMORY (not Redis)
--------------------------
This application targets a single-instance deployment (Azure Container Apps,
min-replicas=1). A process-local counter is sufficient and has zero network
overhead. If the service is ever scaled horizontally, swap the _counters dict
for a Redis sliding-window counter (e.g. ZADD + ZREMRANGEBYSCORE + ZCARD).

RATE LIMITS
-----------
  /api/v1/auth/login:    30 requests per 60 s per IP   (generous for legit users,
                                                         crippling for brute force)
  /api/v1/auth/callback: 15 requests per 60 s per IP   (a user clicking through
                                                         OAuth twice is the max
                                                         realistic scenario)

SLIDING WINDOW ALGORITHM
------------------------
We store a deque of request timestamps per (IP, path_prefix). On each request:
  1. Evict timestamps older than WINDOW_SECONDS from the left of the deque.
  2. If len(deque) >= limit → 429.
  3. Otherwise append current timestamp and proceed.

This is O(n) on the number of requests in the window, which is bounded by the
limit itself (e.g. max 30 elements) — effectively O(1).
"""
from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque
from typing import ClassVar, Deque

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.log import get_logger

logger = get_logger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    # Rules: (path_prefix, window_seconds, max_requests)
    _RULES: ClassVar[list[tuple[str, int, int]]] = [
        ("/api/v1/auth/login",    60, 30),
        ("/api/v1/auth/callback", 60, 15),
    ]

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        # {(ip, path_prefix): deque[float]}
        self._counters: dict[tuple[str, str], Deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        ip = _client_ip(request)

        async with self._lock:
            for prefix, window, limit in self._RULES:
                if not path.startswith(prefix):
                    continue

                bucket = self._counters[(ip, prefix)]
                now = time.monotonic()

                # Evict stale entries from the left (oldest first)
                while bucket and bucket[0] < now - window:
                    bucket.popleft()

                if len(bucket) >= limit:
                    logger.warning(
                        "Rate limit exceeded",
                        extra={"ip_prefix": ip[:8], "path": prefix},
                    )
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={
                            "type": "https://farewell.contoso.com/errors/rate-limit-exceeded",
                            "title": "Rate Limit Exceeded",
                            "status": 429,
                            "detail": "Too many requests. Please wait before trying again.",
                        },
                        headers={"Retry-After": str(window)},
                    )

                bucket.append(now)
                break  # Only the first matching rule applies

        return await call_next(request)


def _client_ip(request: Request) -> str:
    """
    Extract the real client IP, respecting X-Forwarded-For from Azure Front Door.

    SECURITY NOTE: We trust X-Forwarded-For only because the ingress controller
    (Azure Front Door) is the only allowed entry point in production. If running
    behind a misconfigured or absent proxy, the header could be spoofed to bypass
    rate limits. In a zero-trust deployment, validate that the request originates
    from a known Front Door IP range before trusting X-Forwarded-For.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # X-Forwarded-For: client, proxy1, proxy2 → take leftmost (real client)
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
