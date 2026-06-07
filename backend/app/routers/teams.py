"""Team (management / müdürlük) endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("", response_model=list[schemas.TeamOut])
def list_teams(db: Session = Depends(get_db)):
    return db.scalars(select(models.Team).order_by(models.Team.name)).all()


@router.post("", response_model=schemas.TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(payload: schemas.TeamCreate, db: Session = Depends(get_db)):
    team = models.Team(**payload.model_dump())
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.put("/{team_id}", response_model=schemas.TeamOut)
def update_team(team_id: int, payload: schemas.TeamUpdate, db: Session = Depends(get_db)):
    team = db.get(models.Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(team, field, value)
    db.commit()
    db.refresh(team)
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(team_id: int, db: Session = Depends(get_db)):
    team = db.get(models.Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    # Detach members and work items from the team (set NULL) and drop collaborator links.
    for member in db.scalars(
        select(models.TeamMember).where(models.TeamMember.team_id == team_id)
    ).all():
        member.team_id = None
    for item in db.scalars(
        select(models.ProjectWorkItem).where(models.ProjectWorkItem.team_id == team_id)
    ).all():
        item.team_id = None
    for link in db.scalars(
        select(models.WorkItemTeam).where(models.WorkItemTeam.team_id == team_id)
    ).all():
        db.delete(link)
    db.delete(team)
    db.commit()
