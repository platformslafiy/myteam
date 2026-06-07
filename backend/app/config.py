"""Application configuration loaded from environment variables.

Centralising config here keeps the rest of the codebase free of os.environ
lookups and makes the SQLite -> PostgreSQL switch a single-line change.
"""
from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Directory that contains the `app` package (the backend root). Used to build an
# absolute default SQLite path so the DB file is the SAME regardless of the
# process working directory (server vs. seed script vs. stray instances).
BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = (BACKEND_DIR / "team_timeline.db").as_posix()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = f"sqlite:///{DEFAULT_DB_PATH}"
    app_port: int = 8080
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    seed_on_startup: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
