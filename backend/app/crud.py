"""Serialization helpers and shared write logic for work items.

Keeps router code thin by centralising the conversion between ORM objects and
the API response shape, plus the (re)application of nested collections.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from . import models, schemas


def work_item_to_out(item: models.ProjectWorkItem) -> schemas.WorkItemOut:
    """Convert a ProjectWorkItem ORM row into its API response model."""
    return schemas.WorkItemOut(
        id=item.id,
        title=item.title,
        summary=item.summary,
        description=item.description,
        owner_id=item.owner_id,
        team_id=item.team_id,
        requester=item.requester,
        start_date=item.start_date,
        end_date=item.end_date,
        estimated_effort_days=item.estimated_effort_days,
        priority=item.priority,
        status=item.status,
        progress=item.progress,
        color=item.color,
        created_by=item.created_by,
        updated_by=item.updated_by,
        created_at=item.created_at,
        updated_at=item.updated_at,
        assignees=[schemas.AssigneeOut.model_validate(a) for a in item.assignees],
        collaborator_team_ids=[c.team_id for c in item.collaborator_teams],
        subtasks=[schemas.SubTaskOut.model_validate(s) for s in item.subtasks],
        jira_references=[schemas.JiraOut.model_validate(j) for j in item.jira_references],
        comments=[schemas.CommentOut.model_validate(c) for c in item.comments],
        dependency_ids=[d.depends_on_work_item_id for d in item.dependencies],
    )


def apply_assignees(
    db: Session,
    item: models.ProjectWorkItem,
    assignee_ids: list[int] | None,
    assignees: list[schemas.AssigneeIn] | None,
) -> None:
    """Replace the assignee set. Accepts either bare ids or {member_id, role}."""
    combined: dict[int, str | None] = {}
    for mid in assignee_ids or []:
        combined.setdefault(mid, "Support")
    for a in assignees or []:
        combined[a.member_id] = a.role

    if not combined and assignee_ids is None and assignees is None:
        return  # nothing provided -> leave untouched

    item.assignees.clear()
    db.flush()
    for member_id, role in combined.items():
        item.assignees.append(models.WorkItemAssignee(member_id=member_id, role=role))


def apply_collaborator_teams(
    db: Session, item: models.ProjectWorkItem, team_ids: list[int] | None
) -> None:
    """Replace the set of collaborating teams (other teams worked with)."""
    if team_ids is None:
        return
    item.collaborator_teams.clear()
    db.flush()
    seen: set[int] = set()
    for tid in team_ids:
        if tid in seen:
            continue
        seen.add(tid)
        item.collaborator_teams.append(models.WorkItemTeam(team_id=tid))


def apply_jira(
    db: Session, item: models.ProjectWorkItem, refs: list[schemas.JiraIn] | None
) -> None:
    if refs is None:
        return
    item.jira_references.clear()
    db.flush()
    for ref in refs:
        item.jira_references.append(
            models.JiraReference(jira_code=ref.jira_code, jira_url=ref.jira_url)
        )


def apply_dependencies(
    db: Session, item: models.ProjectWorkItem, dependency_ids: list[int] | None
) -> None:
    if dependency_ids is None:
        return
    item.dependencies.clear()
    db.flush()
    for dep_id in dependency_ids:
        if dep_id == item.id:
            continue  # an item cannot depend on itself
        item.dependencies.append(models.WorkItemDependency(depends_on_work_item_id=dep_id))
