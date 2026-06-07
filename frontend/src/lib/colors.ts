import type { Priority, Status } from "@/types";

// Central source of truth for status / priority colors used across badges,
// timeline bars, KPI cards and the legend.

export const STATUS_META: Record<
  Status,
  { color: string; bg: string; text: string; label: string }
> = {
  Planned: { color: "#6366f1", bg: "bg-indigo-500/15", text: "text-indigo-600 dark:text-indigo-300", label: "Planned" },
  "In Progress": { color: "#0ea5e9", bg: "bg-sky-500/15", text: "text-sky-600 dark:text-sky-300", label: "In Progress" },
  Blocked: { color: "#ef4444", bg: "bg-red-500/15", text: "text-red-600 dark:text-red-300", label: "Blocked" },
  Completed: { color: "#10b981", bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-300", label: "Completed" },
  Cancelled: { color: "#94a3b8", bg: "bg-slate-400/15", text: "text-slate-500 dark:text-slate-400", label: "Cancelled" },
};

export const PRIORITY_META: Record<
  Priority,
  { color: string; bg: string; text: string; label: string }
> = {
  Low: { color: "#64748b", bg: "bg-slate-400/15", text: "text-slate-600 dark:text-slate-300", label: "Low" },
  Medium: { color: "#0ea5e9", bg: "bg-sky-500/15", text: "text-sky-600 dark:text-sky-300", label: "Medium" },
  High: { color: "#f59e0b", bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-300", label: "High" },
  Critical: { color: "#ef4444", bg: "bg-red-500/15", text: "text-red-600 dark:text-red-300", label: "Critical" },
};

/** Resolve the bar color for a work item: explicit color, else status color. */
export function barColor(status: Status, color?: string | null): string {
  return color || STATUS_META[status].color;
}

// --------------------------------------------------------------------------- //
// Deadline-risk based bar coloring (the rule used on the timeline)
//   green  -> completed
//   grey   -> cancelled
//   red    -> at risk: overdue, due within RISK_DAYS, or blocked
//   blue   -> normal / on track
// --------------------------------------------------------------------------- //
export const RISK_DAYS = 5;

export const RISK_COLORS = {
  completed: "#10b981",
  cancelled: "#94a3b8",
  risk: "#ef4444",
  normal: "#3b82f6",
} as const;

function daysUntil(endISO: string, today: Date): number {
  const [y, m, d] = endISO.split("-").map(Number);
  const end = new Date(y, (m ?? 1) - 1, d ?? 1);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((end.getTime() - t.getTime()) / 86400000);
}

/** Bar color by deadline risk. `today` defaults to now. */
export function riskBarColor(status: Status, endISO: string, today: Date = new Date()): string {
  if (status === "Completed") return RISK_COLORS.completed;
  if (status === "Cancelled") return RISK_COLORS.cancelled;
  const left = daysUntil(endISO, today);
  if (status === "Blocked" || left < 0 || left <= RISK_DAYS) return RISK_COLORS.risk;
  return RISK_COLORS.normal;
}

/** Lower number = higher priority (used to order/stack bars). */
export const PRIORITY_RANK: Record<Priority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

/** Compact priority symbol shown on bars. */
export const PRIORITY_SYMBOL: Record<Priority, string> = {
  Critical: "!!!",
  High: "!!",
  Medium: "!",
  Low: "·",
};
