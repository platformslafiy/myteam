"""Pydantic schemas (request/response models) with validation.

These define the REST contract and enforce backend validation rules such as
valid enum values, progress range, and end_date >= start_date.
"""
from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class Priority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class Status(str, Enum):
    PLANNED = "Planned"
    IN_PROGRESS = "In Progress"
    BLOCKED = "Blocked"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


# --------------------------------------------------------------------------- #
# Team (management / müdürlük)
# --------------------------------------------------------------------------- #
class TeamBase(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=400)
    color: str = Field(default="#6366f1", max_length=9)


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=400)
    color: str | None = Field(default=None, max_length=9)


class TeamOut(TeamBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# --------------------------------------------------------------------------- #
# Team member
# --------------------------------------------------------------------------- #
class TeamMemberBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=160)
    title: str | None = Field(default=None, max_length=160)
    department: str | None = Field(default=None, max_length=160)
    email: str | None = Field(default=None, max_length=200)
    avatar_color: str = Field(default="#6366f1", max_length=9)
    is_active: bool = True
    team_id: int | None = None


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=160)
    title: str | None = Field(default=None, max_length=160)
    department: str | None = Field(default=None, max_length=160)
    email: str | None = Field(default=None, max_length=200)
    avatar_color: str | None = Field(default=None, max_length=9)
    is_active: bool | None = None
    team_id: int | None = None


class TeamMemberOut(TeamMemberBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# --------------------------------------------------------------------------- #
# Nested work-item collections
# --------------------------------------------------------------------------- #
class AssigneeIn(BaseModel):
    member_id: int
    role: str | None = "Support"


class AssigneeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    member_id: int
    role: str | None = None


class JiraIn(BaseModel):
    jira_code: str = Field(min_length=1, max_length=60)
    jira_url: str | None = Field(default=None, max_length=500)


class JiraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    jira_code: str
    jira_url: str | None = None


class SubTaskAssigneeIn(BaseModel):
    member_id: int
    role: str | None = "Support"


class SubTaskAssigneeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    member_id: int
    role: str | None = None


class SubTaskLogIn(BaseModel):
    log_date: date
    note: str = Field(min_length=1)
    progress: int | None = Field(default=None, ge=0, le=100)
    created_by: str | None = None


class SubTaskLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    subtask_id: int
    log_date: date
    note: str
    progress: int | None = None
    created_by: str | None = None
    created_at: datetime


class SubTaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    start_date: date
    end_date: date
    progress: int = Field(default=0, ge=0, le=100)
    color: str | None = Field(default=None, max_length=9)
    position: int = 0
    owner_id: int | None = None

    @model_validator(mode="after")
    def _check_dates(self) -> "SubTaskBase":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class SubTaskCreate(SubTaskBase):
    assignee_ids: list[int] = Field(default_factory=list)
    assignees: list[SubTaskAssigneeIn] = Field(default_factory=list)
    team_ids: list[int] = Field(default_factory=list)


class SubTaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    start_date: date | None = None
    end_date: date | None = None
    progress: int | None = Field(default=None, ge=0, le=100)
    color: str | None = Field(default=None, max_length=9)
    position: int | None = None
    owner_id: int | None = None
    assignee_ids: list[int] | None = None
    assignees: list[SubTaskAssigneeIn] | None = None
    team_ids: list[int] | None = None

    @model_validator(mode="after")
    def _check_dates(self) -> "SubTaskUpdate":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class SubTaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    work_item_id: int
    title: str
    start_date: date
    end_date: date
    progress: int
    color: str | None = None
    position: int
    owner_id: int | None = None
    assignees: list[SubTaskAssigneeOut] = []
    team_ids: list[int] = []
    logs: list[SubTaskLogOut] = []


class CommentIn(BaseModel):
    comment: str = Field(min_length=1)
    created_by: str | None = None


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    comment: str
    created_by: str | None = None
    created_at: datetime


# --------------------------------------------------------------------------- #
# Work item
# --------------------------------------------------------------------------- #
class WorkItemBase(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    summary: str | None = Field(default=None, max_length=500)
    description: str | None = None
    owner_id: int | None = None
    team_id: int | None = None
    requester: str | None = Field(default=None, max_length=200)
    start_date: date
    end_date: date
    estimated_effort_days: float | None = Field(default=None, ge=0)
    priority: Priority = Priority.MEDIUM
    status: Status = Status.PLANNED
    progress: int = Field(default=0, ge=0, le=100)
    color: str | None = Field(default=None, max_length=9)
    created_by: str | None = Field(default=None, max_length=160)
    updated_by: str | None = Field(default=None, max_length=160)

    @model_validator(mode="after")
    def _check_dates(self) -> "WorkItemBase":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class WorkItemCreate(WorkItemBase):
    assignee_ids: list[int] = Field(default_factory=list)
    assignees: list[AssigneeIn] = Field(default_factory=list)
    collaborator_team_ids: list[int] = Field(default_factory=list)
    jira_references: list[JiraIn] = Field(default_factory=list)
    dependency_ids: list[int] = Field(default_factory=list)


class WorkItemUpdate(BaseModel):
    """Partial update. All fields optional; date ordering checked when both present."""

    title: str | None = Field(default=None, min_length=1, max_length=240)
    summary: str | None = Field(default=None, max_length=500)
    description: str | None = None
    owner_id: int | None = None
    team_id: int | None = None
    requester: str | None = Field(default=None, max_length=200)
    start_date: date | None = None
    end_date: date | None = None
    estimated_effort_days: float | None = Field(default=None, ge=0)
    priority: Priority | None = None
    status: Status | None = None
    progress: int | None = Field(default=None, ge=0, le=100)
    color: str | None = Field(default=None, max_length=9)
    updated_by: str | None = Field(default=None, max_length=160)

    # Replace-collections (only applied when provided).
    assignee_ids: list[int] | None = None
    assignees: list[AssigneeIn] | None = None
    collaborator_team_ids: list[int] | None = None
    jira_references: list[JiraIn] | None = None
    dependency_ids: list[int] | None = None

    @model_validator(mode="after")
    def _check_dates(self) -> "WorkItemUpdate":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class WorkItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    summary: str | None
    description: str | None
    owner_id: int | None
    team_id: int | None
    requester: str | None
    start_date: date
    end_date: date
    estimated_effort_days: float | None
    priority: str
    status: str
    progress: int
    color: str | None
    created_by: str | None
    updated_by: str | None
    created_at: datetime
    updated_at: datetime
    assignees: list[AssigneeOut] = []
    collaborator_team_ids: list[int] = []
    subtasks: list[SubTaskOut] = []
    jira_references: list[JiraOut] = []
    comments: list[CommentOut] = []
    dependency_ids: list[int] = []


# --------------------------------------------------------------------------- #
# Dashboard
# --------------------------------------------------------------------------- #
class DashboardSummary(BaseModel):
    total_active: int
    planned: int
    in_progress: int
    blocked: int
    overdue: int
    completed: int
    starting_this_week: int
    ending_this_month: int
    busiest_members: list["MemberLoad"]


class MemberLoad(BaseModel):
    member_id: int
    full_name: str
    avatar_color: str
    active_count: int


class WorkloadRow(BaseModel):
    member_id: int
    full_name: str
    title: str | None
    department: str | None
    avatar_color: str
    active_count: int
    overdue_count: int
    blocked_count: int
    total_effort_days: float
