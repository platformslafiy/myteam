"""Sub-task endpoints.

Sub-tasks belong to a work item and are planned on the detail Gantt. The parent
work item's start/end dates are always derived from the min/max of its
sub-tasks, so editing a sub-task (incl. drag on the Gantt) keeps the parent bar
in sync on the main timeline. All endpoints return the refreshed parent
``WorkItemOut`` so the client updates both the sub-tasks and the parent in one
round-trip.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(prefix="/api", tags=["subtasks"])


def _load_item(db: Session, item_id: int) -> models.ProjectWorkItem:
    stmt = (
        select(models.ProjectWorkItem)
        .where(models.ProjectWorkItem.id == item_id)
        .options(
            selectinload(models.ProjectWorkItem.assignees),
            selectinload(models.ProjectWorkItem.collaborator_teams),
            selectinload(models.ProjectWorkItem.subtasks).options(
                selectinload(models.SubTask.assignees),
                selectinload(models.SubTask.teams),
                selectinload(models.SubTask.logs),
            ),
            selectinload(models.ProjectWorkItem.jira_references),
            selectinload(models.ProjectWorkItem.comments),
            selectinload(models.ProjectWorkItem.dependencies),
        )
    )
    item = db.scalars(stmt).first()
    if not item:
        raise HTTPException(status_code=404, detail="Work item not found")
    return item


def _recompute_parent(item: models.ProjectWorkItem) -> None:
    """Roll sub-tasks up into the parent: start/end = min/max, and progress =
    duration-weighted average of sub-task progress. No-op when there are none
    (the parent keeps its manually set dates/progress)."""
    if not item.subtasks:
        return
    item.start_date = min(s.start_date for s in item.subtasks)
    item.end_date = max(s.end_date for s in item.subtasks)

    total_days = 0
    weighted = 0
    for s in item.subtasks:
        days = (s.end_date - s.start_date).days + 1
        total_days += days
        weighted += (s.progress or 0) * days
    item.progress = round(weighted / total_days) if total_days else 0


@router.post(
    "/work-items/{item_id}/subtasks",
    response_model=schemas.WorkItemOut,
    status_code=status.HTTP_201_CREATED,
)
def create_subtask(item_id: int, payload: schemas.SubTaskCreate, db: Session = Depends(get_db)):
    item = _load_item(db, item_id)
    base = payload.model_dump(exclude={"assignee_ids", "assignees", "team_ids"})
    subtask = models.SubTask(**base)
    item.subtasks.append(subtask)
    db.flush()
    crud.apply_subtask_people(db, subtask, payload.assignee_ids, payload.assignees, payload.team_ids)
    db.flush()
    _recompute_parent(item)
    db.commit()
    return crud.work_item_to_out(_load_item(db, item_id))


@router.put("/subtasks/{subtask_id}", response_model=schemas.WorkItemOut)
def update_subtask(subtask_id: int, payload: schemas.SubTaskUpdate, db: Session = Depends(get_db)):
    subtask = db.get(models.SubTask, subtask_id)
    if not subtask:
        raise HTTPException(status_code=404, detail="Sub-task not found")

    data = payload.model_dump(exclude_unset=True)
    new_start = data.get("start_date", subtask.start_date)
    new_end = data.get("end_date", subtask.end_date)
    if new_end < new_start:
        raise HTTPException(status_code=422, detail="end_date must be on or after start_date")

    scalar_fields = {"title", "start_date", "end_date", "progress", "color", "position", "owner_id"}
    for field in scalar_fields & data.keys():
        setattr(subtask, field, data[field])

    if "assignee_ids" in data or "assignees" in data or "team_ids" in data:
        crud.apply_subtask_people(
            db,
            subtask,
            data.get("assignee_ids"),
            payload.assignees,
            data.get("team_ids"),
        )

    db.flush()
    item = _load_item(db, subtask.work_item_id)
    _recompute_parent(item)
    db.commit()
    return crud.work_item_to_out(_load_item(db, item.id))


@router.delete("/subtasks/{subtask_id}", response_model=schemas.WorkItemOut)
def delete_subtask(subtask_id: int, db: Session = Depends(get_db)):
    subtask = db.get(models.SubTask, subtask_id)
    if not subtask:
        raise HTTPException(status_code=404, detail="Sub-task not found")
    item_id = subtask.work_item_id
    db.delete(subtask)
    db.flush()
    item = _load_item(db, item_id)
    _recompute_parent(item)
    db.commit()
    return crud.work_item_to_out(_load_item(db, item_id))


# --------------------------------------------------------------------------- #
# Sub-task history / activity log
# --------------------------------------------------------------------------- #
@router.post(
    "/subtasks/{subtask_id}/logs",
    response_model=schemas.WorkItemOut,
    status_code=status.HTTP_201_CREATED,
)
def add_subtask_log(subtask_id: int, payload: schemas.SubTaskLogIn, db: Session = Depends(get_db)):
    subtask = db.get(models.SubTask, subtask_id)
    if not subtask:
        raise HTTPException(status_code=404, detail="Sub-task not found")
    subtask.logs.append(models.SubTaskLog(**payload.model_dump()))
    # A log that records a progress value advances the sub-task's progress.
    if payload.progress is not None:
        subtask.progress = payload.progress
    db.flush()
    item = _load_item(db, subtask.work_item_id)
    _recompute_parent(item)  # roll the new progress up into the parent
    db.commit()
    return crud.work_item_to_out(_load_item(db, item.id))


@router.delete("/subtask-logs/{log_id}", response_model=schemas.WorkItemOut)
def delete_subtask_log(log_id: int, db: Session = Depends(get_db)):
    log = db.get(models.SubTaskLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    work_item_id = log.subtask.work_item_id
    db.delete(log)
    db.commit()
    return crud.work_item_to_out(_load_item(db, work_item_id))
