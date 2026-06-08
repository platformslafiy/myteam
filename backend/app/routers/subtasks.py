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
            selectinload(models.ProjectWorkItem.subtasks),
            selectinload(models.ProjectWorkItem.jira_references),
            selectinload(models.ProjectWorkItem.comments),
            selectinload(models.ProjectWorkItem.dependencies),
        )
    )
    item = db.scalars(stmt).first()
    if not item:
        raise HTTPException(status_code=404, detail="Work item not found")
    return item


def _recompute_parent_dates(item: models.ProjectWorkItem) -> None:
    """Parent start/end = min/max of its sub-tasks (no-op when there are none)."""
    if item.subtasks:
        item.start_date = min(s.start_date for s in item.subtasks)
        item.end_date = max(s.end_date for s in item.subtasks)


@router.post(
    "/work-items/{item_id}/subtasks",
    response_model=schemas.WorkItemOut,
    status_code=status.HTTP_201_CREATED,
)
def create_subtask(item_id: int, payload: schemas.SubTaskCreate, db: Session = Depends(get_db)):
    item = _load_item(db, item_id)
    item.subtasks.append(models.SubTask(**payload.model_dump()))
    db.flush()
    db.refresh(item)
    _recompute_parent_dates(item)
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
    for field, value in data.items():
        setattr(subtask, field, value)

    db.flush()
    item = _load_item(db, subtask.work_item_id)
    _recompute_parent_dates(item)
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
    _recompute_parent_dates(item)
    db.commit()
    return crud.work_item_to_out(_load_item(db, item_id))
