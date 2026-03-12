"""Logging configuration for Gazprom Proekt application.

Provides structured logging with JSON output for production environments
and human-readable output for development.
"""

import json
import logging as log_module
import os
from datetime import datetime
from logging import (
    DEBUG,
    ERROR,
    INFO,
    Formatter,
    Logger,
    StreamHandler,
    getLogger,
    handlers,
)
from typing import Any, Dict


class JSONFormatter(handlers.Formatter):
    """Custom formatter that outputs logs as JSON."""

    def format(self, record: handlers.LogRecord) -> str:
        """Format log record as JSON.

        Args:
            record: Log record to format

        Returns:
            JSON-formatted log string
        """
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id

        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        return json.dumps(log_data)


def _setup_console_handler(root_logger: Logger, log_level: str) -> None:
    """Setup console handler for logging.

    Args:
        root_logger: Root logger instance
        log_level: Logging level string
    """
    handler = StreamHandler()
    handler.setLevel(getattr(log_module, log_level))
    fmt = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    handler.setFormatter(Formatter(fmt))
    root_logger.addHandler(handler)


def _create_rotating_handler(log_path: str, level: int) -> handlers.RotatingFileHandler:
    """Create a rotating file handler.

    Args:
        log_path: Path to log file
        level: Logging level

    Returns:
        Configured rotating file handler
    """
    handler = handlers.RotatingFileHandler(log_path, maxBytes=10485760, backupCount=5)
    handler.setLevel(level)
    handler.setFormatter(JSONFormatter())
    return handler


def _setup_file_handlers(root_logger: Logger, log_dir: str) -> None:
    """Setup file handlers for logging.

    Args:
        root_logger: Root logger instance
        log_dir: Directory for log files
    """
    # App log handler
    app_path = os.path.join(log_dir, "app.log")
    root_logger.addHandler(_create_rotating_handler(app_path, DEBUG))

    # Error log handler
    error_path = os.path.join(log_dir, "error.log")
    root_logger.addHandler(_create_rotating_handler(error_path, ERROR))

    # Access log handler
    access_path = os.path.join(log_dir, "access.log")
    access_handler = _create_rotating_handler(access_path, INFO)
    access_logger = getLogger("api.access")
    access_logger.addHandler(access_handler)
    access_logger.propagate = False


def setup_logging(log_level: str = "INFO") -> None:
    """Configure logging for the application.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    # Create logs directory
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # Get root logger
    root_logger = getLogger()
    root_logger.setLevel(getattr(log_module, log_level))

    # Remove existing handlers
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    # Setup handlers
    _setup_console_handler(root_logger, log_level)
    _setup_file_handlers(root_logger, log_dir)


def get_logger(name: str) -> Logger:
    """Get a logger instance for a module.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Configured logger instance
    """
    return getLogger(name)
