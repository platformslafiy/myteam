"""Database engine, session factory and declarative base.

The engine is built from ``settings.database_url`` so moving from SQLite to
PostgreSQL only requires changing the env var. The ``connect_args`` below are
SQLite-specific and are applied conditionally.
"""
from __future__ import annotations

import logging
from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings

logger = logging.getLogger("team-timeline.db")

_is_sqlite = settings.database_url.startswith("sqlite")

engine = create_engine(
    settings.database_url,
    # check_same_thread is only relevant (and valid) for SQLite.
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base shared by all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a scoped DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema() -> None:
    """Create missing tables and add any missing columns (lightweight migration).

    ``create_all`` only creates missing *tables*; it never alters existing ones.
    When a model gains a new column (e.g. ``team_id``) on top of an older DB
    file, queries would otherwise fail with "no such column" and return HTTP
    500. This adds the missing columns in place (SQLite + PostgreSQL both
    support ``ALTER TABLE ... ADD COLUMN``), so the app self-heals without
    losing data. Only NULL-able / defaulted columns can be added this way, which
    is the case for every additive column in this schema.
    """
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    for table in Base.metadata.sorted_tables:
        if table.name not in existing_tables:
            continue
        existing_cols = {c["name"] for c in inspector.get_columns(table.name)}
        for column in table.columns:
            if column.name in existing_cols:
                continue
            col_type = column.type.compile(dialect=engine.dialect)
            ddl = f'ALTER TABLE "{table.name}" ADD COLUMN "{column.name}" {col_type}'
            try:
                with engine.begin() as conn:
                    conn.execute(text(ddl))
                logger.warning("Schema auto-heal: added %s.%s", table.name, column.name)
            except Exception as exc:  # pragma: no cover - defensive
                logger.error("Could not add column %s.%s: %s", table.name, column.name, exc)
