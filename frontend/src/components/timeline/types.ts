// Timeline abstraction layer.
//
// The TimelinePage talks to a timeline ONLY through this interface, so the
// rendering engine can be swapped without touching page logic. The default
// implementation is `CustomTimeline` (zero-dependency, fully owned). To switch
// to FullCalendar Resource Timeline / DHTMLX Gantt / Frappe Gantt, write a new
// component implementing `TimelineProps` and re-export it from ./index.ts.

import type { ReactNode } from "react";
import type { Priority, Status } from "@/types";

export type ZoomLevel = "day" | "week" | "month" | "year";

export interface TimelineResource {
  id: number;
  label: string;
  sublabel?: string;
  color: string;
  /** Optional badge text shown on the row (e.g. active item count). */
  badge?: string;
}

export interface TimelineEvent {
  id: number;
  resourceId: number;
  title: string;
  start: string; // ISO date YYYY-MM-DD
  end: string; // ISO date, inclusive
  color: string;
  status: Status;
  priority: Priority;
  progress: number;
  overdue: boolean;
}

export interface TimelineProps {
  resources: TimelineResource[];
  events: TimelineEvent[];
  zoom: ZoomLevel;
  rangeStart: Date;
  rangeEnd: Date;
  /** Fired when a bar is clicked (opens the summary modal). */
  onEventClick: (id: number) => void;
  /**
   * Optional: fired after a drag-move or resize commits new dates. The default
   * CustomTimeline is click-to-edit only (editing happens in the modal), so it
   * does not call this — kept on the interface for alternative engines.
   */
  onEventChange?: (id: number, start: string, end: string) => void;
  /** Custom tooltip body for a bar. */
  renderTooltip?: (event: TimelineEvent) => ReactNode;
}
