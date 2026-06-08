// Shared domain types — mirror the backend Pydantic schemas.

export type Priority = "Low" | "Medium" | "High" | "Critical";
export type Status = "Planned" | "In Progress" | "Blocked" | "Completed" | "Cancelled";

export const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Critical"];
export const STATUSES: Status[] = [
  "Planned",
  "In Progress",
  "Blocked",
  "Completed",
  "Cancelled",
];

export interface Team {
  id: number;
  name: string;
  description: string | null;
  color: string;
}

export interface TeamInput {
  name: string;
  description?: string | null;
  color?: string;
}

export interface TeamMember {
  id: number;
  full_name: string;
  title: string | null;
  department: string | null;
  email: string | null;
  avatar_color: string;
  is_active: boolean;
  team_id: number | null;
}

export interface TeamMemberInput {
  full_name: string;
  title?: string | null;
  department?: string | null;
  email?: string | null;
  avatar_color?: string;
  is_active?: boolean;
  team_id?: number | null;
}

export interface Assignee {
  id: number;
  member_id: number;
  role: string | null;
}

export interface JiraReference {
  id: number;
  jira_code: string;
  jira_url: string | null;
}

export interface Comment {
  id: number;
  comment: string;
  created_by: string | null;
  created_at: string;
}

export interface SubTask {
  id: number;
  work_item_id: number;
  title: string;
  start_date: string;
  end_date: string;
  progress: number;
  color: string | null;
  position: number;
  owner_id: number | null;
  assignees: Assignee[];
  team_ids: number[];
}

export interface SubTaskInput {
  title: string;
  start_date: string;
  end_date: string;
  progress?: number;
  color?: string | null;
  position?: number;
  owner_id?: number | null;
  assignee_ids?: number[];
  team_ids?: number[];
}

export interface WorkItem {
  id: number;
  title: string;
  summary: string | null;
  description: string | null;
  owner_id: number | null;
  team_id: number | null;
  requester: string | null;
  start_date: string; // ISO date (YYYY-MM-DD)
  end_date: string;
  estimated_effort_days: number | null;
  priority: Priority;
  status: Status;
  progress: number;
  color: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  assignees: Assignee[];
  collaborator_team_ids: number[];
  subtasks: SubTask[];
  jira_references: JiraReference[];
  comments: Comment[];
  dependency_ids: number[];
}

// Payload used by both create and edit (id present => edit).
export interface WorkItemInput {
  title: string;
  summary?: string | null;
  description?: string | null;
  owner_id?: number | null;
  team_id?: number | null;
  requester?: string | null;
  start_date: string;
  end_date: string;
  estimated_effort_days?: number | null;
  priority: Priority;
  status: Status;
  progress: number;
  color?: string | null;
  updated_by?: string | null;
  created_by?: string | null;
  assignees: { member_id: number; role: string | null }[];
  collaborator_team_ids: number[];
  jira_references: { jira_code: string; jira_url: string | null }[];
  dependency_ids: number[];
}

export interface MemberLoad {
  member_id: number;
  full_name: string;
  avatar_color: string;
  active_count: number;
}

export interface DashboardSummary {
  total_active: number;
  planned: number;
  in_progress: number;
  blocked: number;
  overdue: number;
  completed: number;
  starting_this_week: number;
  ending_this_month: number;
  busiest_members: MemberLoad[];
}

export interface WorkloadRow {
  member_id: number;
  full_name: string;
  title: string | null;
  department: string | null;
  avatar_color: string;
  active_count: number;
  overdue_count: number;
  blocked_count: number;
  total_effort_days: number;
}

export interface Filters {
  teamId: number | null;
  memberId: number | null;
  project: string;
  status: Status | null;
  priority: Priority | null;
  jira: string;
  startAfter: string | null;
  endBefore: string | null;
}

export const EMPTY_FILTERS: Filters = {
  teamId: null,
  memberId: null,
  project: "",
  status: null,
  priority: null,
  jira: "",
  startAfter: null,
  endBefore: null,
};
