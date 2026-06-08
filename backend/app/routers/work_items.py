"""Work item (project / task) endpoints with filtering and nested writes."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/work-items", tags=["work-items"])


def _load(db: Session, item_id: int) -> models.ProjectWorkItem:
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


def _team_of_member(db: Session, member_id: int | None) -> int | None:
    if member_id is None:
        return None
    member = db.get(models.TeamMember, member_id)
    return member.team_id if member else None


def _validate_owner(db: Session, owner_id: int | None) -> None:
    if owner_id is not None and not db.get(models.TeamMember, owner_id):
        raise HTTPException(status_code=422, detail=f"Owner {owner_id} does not exist")


@router.get("", response_model=list[schemas.WorkItemOut])
def list_work_items(
    db: Session = Depends(get_db),
    owner_id: int | None = None,
    member_id: int | None = Query(default=None, description="Owner OR assignee match"),
    team_id: int | None = Query(default=None, description="Filter by team"),
    project: str | None = Query(default=None, description="Search in title"),
    status_: str | None = Query(default=None, alias="status"),
    priority: str | None = None,
    jira: str | None = Query(default=None, description="Search by JIRA code"),
    start_after: date | None = None,
    end_before: date | None = None,
):
    stmt = select(models.ProjectWorkItem).options(
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

    if owner_id is not None:
        stmt = stmt.where(models.ProjectWorkItem.owner_id == owner_id)
    if team_id is not None:
        stmt = stmt.where(
            or_(
                models.ProjectWorkItem.team_id == team_id,
                models.ProjectWorkItem.collaborator_teams.any(
                    models.WorkItemTeam.team_id == team_id
                ),
            )
        )
    if member_id is not None:
        stmt = stmt.where(
            or_(
                models.ProjectWorkItem.owner_id == member_id,
                models.ProjectWorkItem.assignees.any(
                    models.WorkItemAssignee.member_id == member_id
                ),
            )
        )
    if project:
        stmt = stmt.where(models.ProjectWorkItem.title.ilike(f"%{project}%"))
    if status_:
        stmt = stmt.where(models.ProjectWorkItem.status == status_)
    if priority:
        stmt = stmt.where(models.ProjectWorkItem.priority == priority)
    if jira:
        stmt = stmt.where(
            models.ProjectWorkItem.jira_references.any(
                models.JiraReference.jira_code.ilike(f"%{jira}%")
            )
        )
    if start_after:
        stmt = stmt.where(models.ProjectWorkItem.end_date >= start_after)
    if end_before:
        stmt = stmt.where(models.ProjectWorkItem.start_date <= end_before)

    stmt = stmt.order_by(models.ProjectWorkItem.start_date)
    return [crud.work_item_to_out(i) for i in db.scalars(stmt).all()]


@router.get("/{item_id}", response_model=schemas.WorkItemOut)
def get_work_item(item_id: int, db: Session = Depends(get_db)):
    return crud.work_item_to_out(_load(db, item_id))


@router.post("", response_model=schemas.WorkItemOut, status_code=status.HTTP_201_CREATED)
def create_work_item(payload: schemas.WorkItemCreate, db: Session = Depends(get_db)):
    _validate_owner(db, payload.owner_id)

    base = payload.model_dump(
        exclude={
            "assignee_ids",
            "assignees",
            "collaborator_team_ids",
            "jira_references",
            "dependency_ids",
        }
    )
    # priority/status come through as enums -> store their .value
    base["priority"] = payload.priority.value
    base["status"] = payload.status.value
    # Default the item's team to its owner's team so it survives owner deletion.
    if base.get("team_id") is None:
        base["team_id"] = _team_of_member(db, payload.owner_id)

    item = models.ProjectWorkItem(**base)
    db.add(item)
    db.flush()

    crud.apply_assignees(db, item, payload.assignee_ids, payload.assignees)
    crud.apply_collaborator_teams(db, item, payload.collaborator_team_ids)
    crud.apply_jira(db, item, payload.jira_references)
    crud.apply_dependencies(db, item, payload.dependency_ids)

    db.commit()
    return crud.work_item_to_out(_load(db, item.id))


@router.put("/{item_id}", response_model=schemas.WorkItemOut)
def update_work_item(item_id: int, payload: schemas.WorkItemUpdate, db: Session = Depends(get_db)):
    item = _load(db, item_id)
    data = payload.model_dump(exclude_unset=True)

    if "owner_id" in data:
        _validate_owner(db, data["owner_id"])

    # Combined-date validation against existing values.
    new_start = data.get("start_date", item.start_date)
    new_end = data.get("end_date", item.end_date)
    if new_end < new_start:
        raise HTTPException(status_code=422, detail="end_date must be on or after start_date")

    scalar_fields = {
        "title", "summary", "description", "owner_id", "team_id", "requester",
        "start_date", "end_date", "estimated_effort_days", "priority", "status",
        "progress", "color", "updated_by",
    }
    for field in scalar_fields & data.keys():
        value = data[field]
        if field in ("priority", "status") and value is not None:
            value = value.value if hasattr(value, "value") else value
        setattr(item, field, value)

    # If the owner changed but no explicit team was given, keep team in sync
    # with the new owner's team (so the item lands in the right backlog later).
    if "owner_id" in data and "team_id" not in data and data["owner_id"] is not None:
        item.team_id = _team_of_member(db, data["owner_id"])

    if "assignee_ids" in data or "assignees" in data:
        crud.apply_assignees(db, item, data.get("assignee_ids"), payload.assignees)
    if "collaborator_team_ids" in data:
        crud.apply_collaborator_teams(db, item, data.get("collaborator_team_ids"))
    if "jira_references" in data:
        crud.apply_jira(db, item, payload.jira_references)
    if "dependency_ids" in data:
        crud.apply_dependencies(db, item, data.get("dependency_ids"))

    db.commit()
    return crud.work_item_to_out(_load(db, item.id))


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(models.ProjectWorkItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Work item not found")
    db.delete(item)
    db.commit()


# --------------------------------------------------------------------------- #
# Comments / notes (nested resource)
# --------------------------------------------------------------------------- #
@router.post(
    "/{item_id}/comments",
    response_model=schemas.CommentOut,
    status_code=status.HTTP_201_CREATED,
)
def add_comment(item_id: int, payload: schemas.CommentIn, db: Session = Depends(get_db)):
    _load(db, item_id)  # ensures item exists
    comment = models.Comment(work_item_id=item_id, **payload.model_dump())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
