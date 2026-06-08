import type {
  Comment,
  DashboardSummary,
  Filters,
  SubTaskInput,
  Team,
  TeamInput,
  TeamMember,
  TeamMemberInput,
  WorkItem,
  WorkItemInput,
  WorkloadRow,
} from "@/types";

const BASE = "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError("Cannot reach the API server. Is the backend running?", 0);
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) {
        detail = Array.isArray(body.detail)
          ? body.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join(", ")
          : String(body.detail);
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function buildWorkItemQuery(filters: Filters): string {
  const p = new URLSearchParams();
  if (filters.teamId != null) p.set("team_id", String(filters.teamId));
  if (filters.memberId != null) p.set("member_id", String(filters.memberId));
  if (filters.project) p.set("project", filters.project);
  if (filters.status) p.set("status", filters.status);
  if (filters.priority) p.set("priority", filters.priority);
  if (filters.jira) p.set("jira", filters.jira);
  if (filters.startAfter) p.set("start_after", filters.startAfter);
  if (filters.endBefore) p.set("end_before", filters.endBefore);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  // Teams
  getTeams: () => request<Team[]>("/teams"),
  createTeam: (data: TeamInput) =>
    request<Team>("/teams", { method: "POST", body: JSON.stringify(data) }),
  updateTeam: (id: number, data: Partial<TeamInput>) =>
    request<Team>(`/teams/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTeam: (id: number) => request<void>(`/teams/${id}`, { method: "DELETE" }),

  // Members
  getMembers: () => request<TeamMember[]>("/members"),
  createMember: (data: TeamMemberInput) =>
    request<TeamMember>("/members", { method: "POST", body: JSON.stringify(data) }),
  updateMember: (id: number, data: Partial<TeamMemberInput>) =>
    request<TeamMember>(`/members/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMember: (id: number) => request<void>(`/members/${id}`, { method: "DELETE" }),

  // Work items
  getWorkItems: (filters?: Filters) =>
    request<WorkItem[]>(`/work-items${filters ? buildWorkItemQuery(filters) : ""}`),
  getWorkItem: (id: number) => request<WorkItem>(`/work-items/${id}`),
  createWorkItem: (data: WorkItemInput) =>
    request<WorkItem>("/work-items", { method: "POST", body: JSON.stringify(data) }),
  updateWorkItem: (id: number, data: Partial<WorkItemInput>) =>
    request<WorkItem>(`/work-items/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteWorkItem: (id: number) =>
    request<void>(`/work-items/${id}`, { method: "DELETE" }),
  addComment: (id: number, comment: string, createdBy?: string) =>
    request<Comment>(`/work-items/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ comment, created_by: createdBy ?? null }),
    }),

  // Sub-tasks (each mutation returns the refreshed parent work item)
  createSubtask: (itemId: number, data: SubTaskInput) =>
    request<WorkItem>(`/work-items/${itemId}/subtasks`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSubtask: (subtaskId: number, data: Partial<SubTaskInput>) =>
    request<WorkItem>(`/subtasks/${subtaskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteSubtask: (subtaskId: number) =>
    request<WorkItem>(`/subtasks/${subtaskId}`, { method: "DELETE" }),

  // Dashboard
  getSummary: () => request<DashboardSummary>("/dashboard/summary"),
  getWorkload: () => request<WorkloadRow[]>("/dashboard/workload"),
};
