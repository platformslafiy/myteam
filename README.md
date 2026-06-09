# Team Timeline Planner

A per-member **timeline / Gantt-style** planner for managing a large team's
current and upcoming work on a single screen. Resources (team members) are
listed on the left, with a horizontal, zoomable timeline on the right where each
work item appears as a colored, draggable bar.

![Team Timeline Planner](docs/screenshot.png)

> MVP — no login required. Runs locally with seed data, renders work items on a
> timeline, and lets you create / view / edit / delete items through a single
> modal.

---

## Tech stack

| Layer     | Choice                                                                 |
| --------- | ---------------------------------------------------------------------- |
| Frontend  | React + TypeScript + Vite                                              |
| UI        | TailwindCSS + shadcn-style primitives + Radix (Dialog/Select/Tooltip/Toast) + Lucide icons |
| Timeline  | **Custom `Timeline` component** behind a swap-friendly abstraction (see below) |
| Backend   | FastAPI (Python)                                                       |
| ORM / DB  | SQLAlchemy 2.0 + SQLite (PostgreSQL-ready — change one env var)        |
| API       | REST / JSON                                                            |

### Why a custom timeline instead of FullCalendar Resource Timeline?

FullCalendar's **Resource Timeline** view is a *premium* (paid/licensed) plugin.
To keep the MVP free of license keys and fully self-contained, the timeline is
a zero-dependency custom component. It is hidden behind a small interface
(`src/components/timeline/types.ts`), so swapping in FullCalendar, **DHTMLX
Gantt** or **Frappe Gantt** later means writing one component that implements
`TimelineProps` and changing a single re-export in
`src/components/timeline/index.ts` — no page code changes.

---

## Project structure

```
myteam/
├── backend/                     # FastAPI service
│   ├── app/
│   │   ├── main.py              # app + CORS + startup
│   │   ├── config.py           # env-driven settings (port, db url, cors)
│   │   ├── database.py         # engine / session / Base
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── schemas.py          # Pydantic request/response + validation
│   │   ├── crud.py             # serialization + nested-write helpers
│   │   ├── seed.py             # dummy seed (3 teams, 1 member, 6 work items)
│   │   └── routers/            # members / work_items / dashboard
│   ├── requirements.txt
│   └── .env.example
├── docker-compose.yml           # local 2-container stack (backend + nginx frontend)
├── k8s/                         # Kubernetes / OpenShift manifests
└── frontend/                    # React + Vite SPA
    └── src/
        ├── components/
        │   ├── timeline/        # Timeline abstraction + CustomTimeline
        │   ├── ui/              # shadcn-style primitives
        │   ├── TimelinePage.tsx
        │   ├── TimelineToolbar.tsx
        │   ├── FiltersPanel.tsx
        │   ├── KpiCards.tsx
        │   ├── WorkItemModal.tsx
        │   ├── WorkItemSummary.tsx
        │   ├── WorkItemForm.tsx
        │   ├── MemberRow.tsx
        │   ├── StatusBadge.tsx / PriorityBadge.tsx
        │   └── ...
        ├── lib/                 # api client, colors, utils
        └── types.ts
```

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** (tested on Node 20) and npm

---

## Getting started

> **Ports:** the API runs on **8080** and the frontend dev server on **5173**.
> Port **8000 is intentionally left unused.**

### 1) Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # Windows PowerShell
# source .venv/bin/activate           # macOS / Linux

pip install -r requirements.txt
copy .env.example .env                 # cp .env.example .env  (macOS/Linux)

# Seed the database (3 teams, 1 member, 6 dummy work items incl. 1 backlog item)
python -m app.seed

# Run the API on http://127.0.0.1:8080  (Swagger UI at /docs)
python -m app.main
# or explicitly:
# uvicorn app.main:app --port 8080
```

### 2) Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` to the
backend on `8080`, so there are no CORS issues during development.

---

## Running with Docker

Local development uses the Python virtualenv + Vite dev server above. For
deployment, the app also ships as **two containers** (FastAPI backend, nginx
serving the SPA and proxying `/api`). Both images are non-root and listen on
`8080`, so they run unchanged on **Kubernetes / OpenShift** (incl. OpenShift's
arbitrary-UID security model).

```bash
docker compose up --build
# Frontend  -> http://localhost:8081   (proxies /api to the backend)
# Backend   -> http://localhost:8080   (Swagger at /docs)
```

The backend keeps its SQLite file on a named volume (`backend-data`) so data
survives restarts; demo data is seeded only when the DB is empty.

### Kubernetes / OpenShift

Manifests are in [`k8s/`](k8s/) (backend Deployment+Service+PVC, frontend
Deployment+Service, and an OpenShift `Route` / Kubernetes `Ingress`).

```bash
# Build & push the images to your registry, then set the image: fields in k8s/*.yaml
docker build -t <registry>/team-timeline-backend:latest ./backend
docker build -t <registry>/team-timeline-frontend:latest ./frontend
docker push <registry>/team-timeline-backend:latest
docker push <registry>/team-timeline-frontend:latest

kubectl apply -f k8s/        # or: oc apply -f k8s/
```

The frontend reaches the backend via the in-cluster `BACKEND_URL`
(`http://backend:8080`). For production, point `DATABASE_URL` at PostgreSQL and
scale the backend out (SQLite on a RWO volume is single-replica).

## Switching to PostgreSQL

No code changes are required — only the connection string. In `backend/.env`:

```
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/team_timeline
```

Install a driver (`pip install psycopg2-binary`), then run `python -m app.seed`
against the new database.

---

## Features

- **Team-based** (team = management / müdürlük). Members and work items belong to
  a team; manage teams and members (add / edit / delete) from the **"Ekip & Üyeler"**
  dialog in the header.
- **Per-member timeline** with Day / Week / Month / **Year** zoom and a highlighted "today" line.
- **Click a bar** to open it in the modal — editing is modal-only (no accidental
  drag edits).
- **Per-team backlog rows:** when a member is deleted, their work items fall into
  the team's backlog (owner cleared, team preserved). Owner-less items render in a
  `{Team} · Backlog` row.
- **Sub-task detail Gantt:** click a bar → open the work item → **"Detailed plan
  (Gantt)"** opens a dedicated, **drag-and-drop** Gantt (with its own Day / Week /
  Month / Year zoom and a **full-screen** toggle) where you break the task into
  sub-tasks. Clicking a sub-task opens a **detail popup** with **calendar** date
  pickers, an **owner**, **working members**, **teams** and a progress slider —
  just like the main task. The earliest start / latest end of the sub-tasks
  define the parent's dates, its **progress** is the duration-weighted average of
  the sub-tasks, and the union of their people & teams is **rolled up into the
  main task's detail** (contributors / teams). The main task card lists every
  sub-task with its **progress %**; **clicking a sub-task there** opens an
  **activity-timeline** popup to log what was done on a given date (with a
  progress value that advances the sub-task and rolls up to the parent).
- **Stacked lanes** separate overlapping items; higher-priority bars stack on top,
  and each bar shows a **priority indicator** (`!!!` / `!!` / `!` / `·`).
- **Deadline-risk bar colors:** blue = normal / on track, **red = at risk**
  (overdue, due within 5 days, or blocked), green = completed, grey = cancelled.
- **KPI cards:** active, planned, overdue, blocked, starting this week, ending this month.
- **Filters:** team, team member, project name, status, priority, JIRA code, date range.
- **Collaborating teams:** a work item can list other teams it's worked with, and
  support members are shown linked to their own team.
- **Single modal** for create / summary / edit, with confirm-to-delete, toast
  notifications, loading skeletons and empty states.
- **Turkish / English** language switcher in the banner (default Turkish), persisted.
- **Dark / light theme** toggle (persisted).

---

## REST API

Base URL: `http://127.0.0.1:8080`

| Method | Path                              | Description                          |
| ------ | --------------------------------- | ------------------------------------ |
| GET    | `/api/teams`                      | List teams                           |
| POST   | `/api/teams`                      | Create a team                        |
| PUT    | `/api/teams/{id}`                 | Update a team                        |
| DELETE | `/api/teams/{id}`                 | Delete a team (members/items detached) |
| GET    | `/api/members`                    | List team members                    |
| POST   | `/api/members`                    | Create a member                      |
| PUT    | `/api/members/{id}`               | Update a member                      |
| DELETE | `/api/members/{id}`               | Delete a member (items → team backlog) |
| GET    | `/api/work-items`                 | List work items (supports filters)   |
| GET    | `/api/work-items/{id}`            | Get one work item                    |
| POST   | `/api/work-items`                 | Create a work item                   |
| PUT    | `/api/work-items/{id}`            | Update a work item (partial)         |
| DELETE | `/api/work-items/{id}`            | Delete a work item                   |
| POST   | `/api/work-items/{id}/comments`   | Add a note/comment                   |
| POST   | `/api/work-items/{id}/subtasks`   | Add a sub-task (returns parent)      |
| PUT    | `/api/subtasks/{id}`              | Update a sub-task (returns parent)   |
| DELETE | `/api/subtasks/{id}`              | Delete a sub-task (returns parent)   |
| POST   | `/api/subtasks/{id}/logs`         | Add a history/activity entry         |
| DELETE | `/api/subtask-logs/{id}`          | Delete a history entry               |
| GET    | `/api/dashboard/summary`          | KPI summary                          |
| GET    | `/api/dashboard/workload`         | Per-member workload / capacity       |

Work-item filter query params: `team_id`, `member_id`, `owner_id`, `project`,
`status`, `priority`, `jira`, `start_after`, `end_before`.

Interactive docs: **http://127.0.0.1:8080/docs**

---

## TODO / Roadmap (future enhancements)

These are intentionally **out of scope for the MVP** but the architecture is
ready for them:

- [ ] **LDAP / SSO login** (currently no auth)
- [ ] **Role-based authorization** (viewer / editor / admin)
- [ ] **Excel export** of the timeline / work items
- [ ] **PDF export** of the timeline view
- [ ] **JIRA API integration** (live status sync from the linked codes)
- [ ] **Outlook / Teams calendar integration**
- [ ] **Audit log** of all changes (`created_by` / `updated_by` are already captured)
- [ ] **Notification system** (overdue / blocked alerts)
- [ ] **Capacity planning** (effort vs. availability per member — `/dashboard/workload` is the foundation)
- [ ] **Critical path / dependency visualization** (`dependency_ids` is already modeled)

---

## Notes

- This is an MVP intended for local use; the database is a single SQLite file
  (`backend/team_timeline.db`).
- Re-running `python -m app.seed` **resets** the database to the seed data.
