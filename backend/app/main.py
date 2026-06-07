"""FastAPI application entrypoint for Team Timeline Planner."""
from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import ensure_schema
from .routers import dashboard, members, teams, work_items

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("team-timeline")

app = FastAPI(
    title="Team Timeline Planner API",
    version="1.0.0",
    description="REST API powering the per-member timeline / Gantt planner.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(teams.router)
app.include_router(members.router)
app.include_router(work_items.router)
app.include_router(dashboard.router)


@app.on_event("startup")
def on_startup() -> None:
    ensure_schema()
    if settings.seed_on_startup:
        from .seed import run_seed

        run_seed(reset=True)
        logger.info("Database seeded on startup (SEED_ON_STARTUP=true).")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all so the frontend always receives JSON, never an HTML stack page."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


if __name__ == "__main__":
    # Convenience runner: `python -m app.main` (honours APP_PORT, default 8080).
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=settings.app_port, reload=False)
