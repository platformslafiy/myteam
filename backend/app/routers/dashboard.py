"""Dashboard / analytics endpoints: KPI summary and per-member workload."""
from __future__ import annotations

import calendar
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

ACTIVE_STATUSES = {"Planned", "In Progress", "Blocked"}


def _week_bounds(today: date) -> tuple[date, date]:
    start = today - timedelta(days=today.weekday())  # Monday
    return start, start + timedelta(days=6)


def _month_bounds(today: date) -> tuple[date, date]:
    last = calendar.monthrange(today.year, today.month)[1]
    return today.replace(day=1), today.replace(day=last)


@router.get("/summary", response_model=schemas.DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    today = date.today()
    week_start, week_end = _week_bounds(today)
    month_start, month_end = _month_bounds(today)

    items = db.scalars(select(models.ProjectWorkItem)).all()

    total_active = planned = in_progress = blocked = overdue = completed = 0
    starting_this_week = ending_this_month = 0

    for it in items:
        if it.status in ACTIVE_STATUSES:
            total_active += 1
        if it.status == "Planned":
            planned += 1
        elif it.status == "In Progress":
            in_progress += 1
        elif it.status == "Blocked":
            blocked += 1
        elif it.status == "Completed":
            completed += 1
        if it.status in ACTIVE_STATUSES and it.end_date < today:
            overdue += 1
        if week_start <= it.start_date <= week_end:
            starting_this_week += 1
        if month_start <= it.end_date <= month_end and it.status in ACTIVE_STATUSES:
            ending_this_month += 1

    # Busiest members by active owned/assigned count.
    members = db.scalars(
        select(models.TeamMember).options(selectinload(models.TeamMember.owned_items))
    ).all()
    load_map: dict[int, int] = {}
    for it in items:
        if it.status not in ACTIVE_STATUSES:
            continue
        if it.owner_id:
            load_map[it.owner_id] = load_map.get(it.owner_id, 0) + 1

    assignees = db.scalars(select(models.WorkItemAssignee)).all()
    item_status = {it.id: it.status for it in items}
    for a in assignees:
        if item_status.get(a.work_item_id) in ACTIVE_STATUSES:
            load_map[a.member_id] = load_map.get(a.member_id, 0) + 1

    member_by_id = {m.id: m for m in members}
    busiest = sorted(load_map.items(), key=lambda kv: kv[1], reverse=True)[:5]
    busiest_members = [
        schemas.MemberLoad(
            member_id=mid,
            full_name=member_by_id[mid].full_name if mid in member_by_id else "—",
            avatar_color=member_by_id[mid].avatar_color if mid in member_by_id else "#888",
            active_count=count,
        )
        for mid, count in busiest
        if mid in member_by_id
    ]

    return schemas.DashboardSummary(
        total_active=total_active,
        planned=planned,
        in_progress=in_progress,
        blocked=blocked,
        overdue=overdue,
        completed=completed,
        starting_this_week=starting_this_week,
        ending_this_month=ending_this_month,
        busiest_members=busiest_members,
    )


@router.get("/workload", response_model=list[schemas.WorkloadRow])
def dashboard_workload(db: Session = Depends(get_db)):
    today = date.today()
    members = db.scalars(select(models.TeamMember)).all()
    items = db.scalars(
        select(models.ProjectWorkItem).options(
            selectinload(models.ProjectWorkItem.assignees)
        )
    ).all()

    rows: dict[int, schemas.WorkloadRow] = {
        m.id: schemas.WorkloadRow(
            member_id=m.id,
            full_name=m.full_name,
            title=m.title,
            department=m.department,
            avatar_color=m.avatar_color,
            active_count=0,
            overdue_count=0,
            blocked_count=0,
            total_effort_days=0.0,
        )
        for m in members
    }

    def touch(member_id: int, it: models.ProjectWorkItem) -> None:
        row = rows.get(member_id)
        if not row or it.status not in ACTIVE_STATUSES:
            return
        row.active_count += 1
        row.total_effort_days += it.estimated_effort_days or 0.0
        if it.end_date < today:
            row.overdue_count += 1
        if it.status == "Blocked":
            row.blocked_count += 1

    for it in items:
        if it.owner_id:
            touch(it.owner_id, it)
        for a in it.assignees:
            touch(a.member_id, it)

    return sorted(rows.values(), key=lambda r: r.active_count, reverse=True)
