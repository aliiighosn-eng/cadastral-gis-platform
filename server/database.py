"""
Database connection and session management for Gazprom Proekt service.
Handles SQLAlchemy ORM setup and database initialization.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from server.models import Base

# Get database URL from environment or use default SQLite for development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gazprom_proekt.db")

# Create engine with appropriate pool settings
if DATABASE_URL.startswith("postgresql"):
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )
else:
    # SQLite for development
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=NullPool,
        echo=False,
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """Dependency for getting database session in FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def close_db() -> None:
    """Close database connection."""
    engine.dispose()
