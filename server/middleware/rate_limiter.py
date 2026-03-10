"""Rate limiting middleware for API endpoints.

Provides configurable rate limiting to protect API endpoints from abuse
and ensure fair resource usage across clients.
"""

import logging
import time
from collections import defaultdict
from typing import Dict

logger = logging.getLogger(__name__)

# Rate limit configuration
DEFAULT_REQUESTS_PER_MINUTE = 60
DEFAULT_REQUESTS_PER_HOUR = 1000


class RateLimiter:
    """In-memory rate limiter for API endpoints."""

    def __init__(
        self,
        requests_per_minute: int = DEFAULT_REQUESTS_PER_MINUTE,
        requests_per_hour: int = DEFAULT_REQUESTS_PER_HOUR,
    ):
        """Initialize rate limiter.

        Args:
            requests_per_minute: Max requests per minute per client
            requests_per_hour: Max requests per hour per client
        """
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.client_requests: Dict[str, list] = defaultdict(list)

    def is_allowed(self, client_id: str) -> bool:
        """Check if client is allowed to make a request.

        Args:
            client_id: Unique identifier for the client (e.g., IP address)

        Returns:
            True if request is allowed, False if rate limit exceeded
        """
        current_time = time.time()
        minute_ago = current_time - 60
        hour_ago = current_time - 3600

        # Clean old requests
        if client_id in self.client_requests:
            self.client_requests[client_id] = [
                req_time
                for req_time in self.client_requests[client_id]
                if req_time > hour_ago
            ]

        # Check minute limit
        minute_requests = [
            req_time
            for req_time in self.client_requests[client_id]
            if req_time > minute_ago
        ]
        if len(minute_requests) >= self.requests_per_minute:
            logger.warning(
                f"Rate limit exceeded for {client_id}: "
                f"{len(minute_requests)} requests in last minute"
            )
            return False

        # Check hour limit
        if len(self.client_requests[client_id]) >= self.requests_per_hour:
            logger.warning(
                f"Rate limit exceeded for {client_id}: "
                f"{len(self.client_requests[client_id])} requests in last hour"
            )
            return False

        # Record this request
        self.client_requests[client_id].append(current_time)
        return True

    def get_client_stats(self, client_id: str) -> Dict[str, int]:
        """Get rate limit statistics for a client.

        Args:
            client_id: Unique identifier for the client

        Returns:
            Dictionary with minute and hour request counts
        """
        current_time = time.time()
        minute_ago = current_time - 60
        hour_ago = current_time - 3600

        minute_requests = [
            req_time
            for req_time in self.client_requests.get(client_id, [])
            if req_time > minute_ago
        ]
        hour_requests = [
            req_time
            for req_time in self.client_requests.get(client_id, [])
            if req_time > hour_ago
        ]

        return {
            "requests_this_minute": len(minute_requests),
            "requests_this_hour": len(hour_requests),
            "limit_per_minute": self.requests_per_minute,
            "limit_per_hour": self.requests_per_hour,
        }


# Global rate limiter instance
rate_limiter = RateLimiter(
    requests_per_minute=DEFAULT_REQUESTS_PER_MINUTE,
    requests_per_hour=DEFAULT_REQUESTS_PER_HOUR,
)
