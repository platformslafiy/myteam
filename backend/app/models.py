"""SQLAlchemy ORM models for the Team Timeline Planner.

Team-based model: a Team represents a management / müdürlük. Members and work
items belong to a team. Work items keep their team_id even after their owner is
deleted, so they fall into the team's backlog (owner_id = NULL).

Enum-like fields (priority/status) are stored as plain strings to keep the
schema portable across SQLite and PostgreSQL; validation happens at the API
(Pydantic) layer.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Team(Base):
    """A team / management / directorate-level unit (takım = yönetim = müdürlük)."""

    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(String(400))
    color: Mapped[str] = mapped_column(String(9), default="#6366f1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    members: Mapped[list["TeamMember"]] = relationship(back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    title: Mapped[str | None] = mapped_column(String(160))
    department: Mapped[str | None] = mapped_column(String(160))
    email: Mapped[str | None] = mapped_column(String(200))
    avatar_color: Mapped[str] = mapped_column(String(9), default="#6366f1")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    team_id: Mapped[int | None] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"))

    team: Mapped["Team | None"] = relationship(back_populates="members")
    owned_items: Mapped[list["ProjectWorkItem"]] = relationship(
        back_populates="owner", foreign_keys="ProjectWorkItem.owner_id"
    )


class ProjectWorkItem(Base):
    __tablename__ = "project_work_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    summary: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    owner_id: Mapped[int | None] = mapped_column(ForeignKey("team_members.id", ondelete="SET NULL"))
    team_id: Mapped[int | None] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"))
    requester: Mapped[str | None] = mapped_column(String(200))
    start_date: Mapped["Date"] = mapped_column(Date, nullable=False)
    end_date: Mapped["Date"] = mapped_column(Date, nullable=False)
    estimated_effort_days: Mapped[float | None] = mapped_column()
    priority: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Planned", nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    color: Mapped[str | None] = mapped_column(String(9))
    created_by: Mapped[str | None] = mapped_column(String(160))
    updated_by: Mapped[str | None] = mapped_column(String(160))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    owner: Mapped["TeamMember | None"] = relationship(
        back_populates="owned_items", foreign_keys=[owner_id]
    )
    team: Mapped["Team | None"] = relationship()
    assignees: Mapped[list["WorkItemAssignee"]] = relationship(
        back_populates="work_item", cascade="all, delete-orphan"
    )
    collaborator_teams: Mapped[list["WorkItemTeam"]] = relationship(
        back_populates="work_item", cascade="all, delete-orphan"
    )
    subtasks: Mapped[list["SubTask"]] = relationship(
        back_populates="work_item",
        cascade="all, delete-orphan",
        order_by="SubTask.position, SubTask.start_date",
    )
    jira_references: Mapped[list["JiraReference"]] = relationship(
        back_populates="work_item", cascade="all, delete-orphan"
    )
    dependencies: Mapped[list["WorkItemDependency"]] = relationship(
        back_populates="work_item",
        cascade="all, delete-orphan",
        foreign_keys="WorkItemDependency.work_item_id",
    )
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="work_item", cascade="all, delete-orphan"
    )


class WorkItemAssignee(Base):
    """A support / collaborating member on a work item (linked to their team)."""

    __tablename__ = "work_item_assignees"
    __table_args__ = (UniqueConstraint("work_item_id", "member_id", name="uq_item_member"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    work_item_id: Mapped[int] = mapped_column(
        ForeignKey("project_work_items.id", ondelete="CASCADE")
    )
    member_id: Mapped[int] = mapped_column(ForeignKey("team_members.id", ondelete="CASCADE"))
    role: Mapped[str | None] = mapped_column(String(80), default="Support")

    work_item: Mapped["ProjectWorkItem"] = relationship(back_populates="assignees")
    member: Mapped["TeamMember"] = relationship()


class SubTask(Base):
    """A sub-task within a work item, with its own start/end on the detail Gantt.

    The parent work item's start/end are derived from the min/max of its
    sub-tasks (see routers/subtasks.py).
    """

    __tablename__ = "sub_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    work_item_id: Mapped[int] = mapped_column(
        ForeignKey("project_work_items.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    start_date: Mapped["Date"] = mapped_column(Date, nullable=False)
    end_date: Mapped["Date"] = mapped_column(Date, nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    color: Mapped[str | None] = mapped_column(String(9))
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    owner_id: Mapped[int | None] = mapped_column(
        ForeignKey("team_members.id", ondelete="SET NULL")
    )

    work_item: Mapped["ProjectWorkItem"] = relationship(back_populates="subtasks")
    owner: Mapped["TeamMember | None"] = relationship()
    assignees: Mapped[list["SubTaskAssignee"]] = relationship(
        back_populates="subtask", cascade="all, delete-orphan"
    )
    teams: Mapped[list["SubTaskTeam"]] = relationship(
        back_populates="subtask", cascade="all, delete-orphan"
    )
    logs: Mapped[list["SubTaskLog"]] = relationship(
        back_populates="subtask",
        cascade="all, delete-orphan",
        order_by="SubTaskLog.log_date, SubTaskLog.id",
    )


class SubTaskAssignee(Base):
    """A member working on a sub-task (the 'who/with whom')."""

    __tablename__ = "sub_task_assignees"
    __table_args__ = (UniqueConstraint("subtask_id", "member_id", name="uq_subtask_member"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subtask_id: Mapped[int] = mapped_column(ForeignKey("sub_tasks.id", ondelete="CASCADE"))
    member_id: Mapped[int] = mapped_column(ForeignKey("team_members.id", ondelete="CASCADE"))
    role: Mapped[str | None] = mapped_column(String(80), default="Support")

    subtask: Mapped["SubTask"] = relationship(back_populates="assignees")
    member: Mapped["TeamMember"] = relationship()


class SubTaskLog(Base):
    """A dated progress/activity entry for a sub-task (its history timeline)."""

    __tablename__ = "sub_task_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subtask_id: Mapped[int] = mapped_column(ForeignKey("sub_tasks.id", ondelete="CASCADE"))
    log_date: Mapped["Date"] = mapped_column(Date, nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    progress: Mapped[int | None] = mapped_column(Integer)
    created_by: Mapped[str | None] = mapped_column(String(160))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    subtask: Mapped["SubTask"] = relationship(back_populates="logs")


class SubTaskTeam(Base):
    """A team involved in a sub-task."""

    __tablename__ = "sub_task_teams"
    __table_args__ = (UniqueConstraint("subtask_id", "team_id", name="uq_subtask_team"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subtask_id: Mapped[int] = mapped_column(ForeignKey("sub_tasks.id", ondelete="CASCADE"))
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"))

    subtask: Mapped["SubTask"] = relationship(back_populates="teams")
    team: Mapped["Team"] = relationship()


class WorkItemTeam(Base):
    """A collaborating team on a work item (other teams worked with)."""

    __tablename__ = "work_item_teams"
    __table_args__ = (UniqueConstraint("work_item_id", "team_id", name="uq_item_team"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    work_item_id: Mapped[int] = mapped_column(
        ForeignKey("project_work_items.id", ondelete="CASCADE")
    )
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"))

    work_item: Mapped["ProjectWorkItem"] = relationship(back_populates="collaborator_teams")
    team: Mapped["Team"] = relationship()


class JiraReference(Base):
    __tablename__ = "jira_references"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    work_item_id: Mapped[int] = mapped_column(
        ForeignKey("project_work_items.id", ondelete="CASCADE")
    )
    jira_code: Mapped[str] = mapped_column(String(60), nullable=False)
    jira_url: Mapped[str | None] = mapped_column(String(500))

    work_item: Mapped["ProjectWorkItem"] = relationship(back_populates="jira_references")


class WorkItemDependency(Base):
    __tablename__ = "work_item_dependencies"
    __table_args__ = (
        UniqueConstraint("work_item_id", "depends_on_work_item_id", name="uq_dependency"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    work_item_id: Mapped[int] = mapped_column(
        ForeignKey("project_work_items.id", ondelete="CASCADE")
    )
    depends_on_work_item_id: Mapped[int] = mapped_column(
        ForeignKey("project_work_items.id", ondelete="CASCADE")
    )

    work_item: Mapped["ProjectWorkItem"] = relationship(
        back_populates="dependencies", foreign_keys=[work_item_id]
    )


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    work_item_id: Mapped[int] = mapped_column(
        ForeignKey("project_work_items.id", ondelete="CASCADE")
    )
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[str | None] = mapped_column(String(160))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    work_item: Mapped["ProjectWorkItem"] = relationship(back_populates="comments")
