"""Team member endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/members", tags=["members"])


@router.get("", response_model=list[schemas.TeamMemberOut])
def list_members(include_inactive: bool = True, db: Session = Depends(get_db)):
    stmt = select(models.TeamMember).order_by(models.TeamMember.full_name)
    if not include_inactive:
        stmt = stmt.where(models.TeamMember.is_active.is_(True))
    return db.scalars(stmt).all()


@router.post("", response_model=schemas.TeamMemberOut, status_code=status.HTTP_201_CREATED)
def create_member(payload: schemas.TeamMemberCreate, db: Session = Depends(get_db)):
    member = models.TeamMember(**payload.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.put("/{member_id}", response_model=schemas.TeamMemberOut)
def update_member(member_id: int, payload: schemas.TeamMemberUpdate, db: Session = Depends(get_db)):
    member = db.get(models.TeamMember, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(member_id: int, db: Session = Depends(get_db)):
    """Delete a member. Their owned work items fall into the team backlog
    (owner cleared, team_id preserved). Their support-assignee links are removed."""
    member = db.get(models.TeamMember, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")

    owned = db.scalars(
        select(models.ProjectWorkItem).where(models.ProjectWorkItem.owner_id == member_id)
    ).all()
    for item in owned:
        item.owner_id = None  # -> backlog of item.team_id

    for link in db.scalars(
        select(models.WorkItemAssignee).where(models.WorkItemAssignee.member_id == member_id)
    ).all():
        db.delete(link)

    db.delete(member)
    db.commit()
