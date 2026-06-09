# Backend image — FastAPI + Uvicorn.
# OpenShift/Kubernetes friendly: runs as a non-root user, listens on 8080, and
# all paths are group-writable so an arbitrary (OpenShift) UID can run it.
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_PORT=8080 \
    SEED_ON_STARTUP=true \
    DATABASE_URL=sqlite:////app/data/team_timeline.db

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Writable data dir for the SQLite file; make /app group-writable (gid 0) so an
# arbitrary OpenShift UID (which always belongs to group 0) can write to it.
RUN mkdir -p /app/data \
    && chgrp -R 0 /app \
    && chmod -R g=u /app

EXPOSE 8080
USER 1001

# Healthcheck hits the API health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8080/api/health').status==200 else 1)"

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
