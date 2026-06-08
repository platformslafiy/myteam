import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isMonday,
  startOfMonth,
} from "date-fns";
import { PRIORITY_RANK } from "@/lib/colors";
import type { TimelineEvent, ZoomLevel } from "./types";

export const PX_PER_DAY: Record<ZoomLevel, number> = {
  day: 46,
  week: 22,
  month: 9,
  year: 2.7,
};

export interface Tick {
  x: number;
  label: string;
  sublabel?: string;
  strong?: boolean; // month boundary -> stronger gridline
}

export interface MonthBand {
  x: number;
  width: number;
  label: string;
}

export interface Scale {
  pxPerDay: number;
  totalDays: number;
  width: number;
  ticks: Tick[];
  months: MonthBand[];
  /** x offset (px) for a given ISO date or Date. */
  xOf: (date: Date) => number;
  /** ISO date at a given x offset. */
  dateAt: (x: number) => Date;
}

export function parseISO(d: string): Date {
  // Treat as local-midnight to avoid TZ drift on date-only strings.
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, day ?? 1);
}

export function toISO(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function buildScale(rangeStart: Date, rangeEnd: Date, zoom: ZoomLevel): Scale {
  const pxPerDay = PX_PER_DAY[zoom];
  const totalDays = differenceInCalendarDays(rangeEnd, rangeStart) + 1;
  const width = totalDays * pxPerDay;
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  const xOf = (date: Date) => differenceInCalendarDays(date, rangeStart) * pxPerDay;
  const dateAt = (x: number) => addDays(rangeStart, Math.round(x / pxPerDay));

  const ticks: Tick[] = [];
  for (const d of days) {
    const x = xOf(d);
    const isMonthStart = d.getDate() === 1;
    if (zoom === "day") {
      ticks.push({
        x,
        label: format(d, "d"),
        sublabel: format(d, "EEE"),
        strong: isMonthStart,
      });
    } else if (zoom === "week") {
      if (isMonday(d) || isMonthStart) {
        ticks.push({ x, label: format(d, "d MMM"), strong: isMonthStart });
      }
    } else if (zoom === "month") {
      if (isMonthStart) {
        ticks.push({ x, label: format(d, "MMM yyyy"), strong: true });
      }
    } else {
      // year zoom: a tick per month, labelled "MMM", strong on January
      if (isMonthStart) {
        ticks.push({ x, label: format(d, "MMM"), strong: d.getMonth() === 0 });
      }
    }
  }

  // Top-tier bands: years in "year" zoom, otherwise months.
  const months: MonthBand[] = [];
  if (zoom === "year") {
    for (let y = rangeStart.getFullYear(); y <= rangeEnd.getFullYear(); y++) {
      const jan1 = new Date(y, 0, 1);
      const dec31 = new Date(y, 11, 31);
      const bandStart = jan1 < rangeStart ? rangeStart : jan1;
      const bandEnd = dec31 > rangeEnd ? rangeEnd : dec31;
      const x = xOf(bandStart);
      const w = (differenceInCalendarDays(bandEnd, bandStart) + 1) * pxPerDay;
      months.push({ x, width: w, label: String(y) });
    }
  } else {
    let cursor = startOfMonth(rangeStart);
    while (cursor <= rangeEnd) {
      const next = startOfMonth(addDays(cursor, 32));
      const bandStart = cursor < rangeStart ? rangeStart : cursor;
      const bandEnd = addDays(next, -1) > rangeEnd ? rangeEnd : addDays(next, -1);
      const x = xOf(bandStart);
      const w = (differenceInCalendarDays(bandEnd, bandStart) + 1) * pxPerDay;
      months.push({ x, width: w, label: format(cursor, "MMMM yyyy") });
      cursor = next;
    }
  }

  return { pxPerDay, totalDays, width, ticks, months, xOf, dateAt };
}

/**
 * Greedy lane assignment so overlapping events in the same row stack.
 * Sorted by priority (highest first) then start date, so higher-priority bars
 * tend to occupy the top lanes — making the priority ordering visible.
 */
export function assignLanes(events: TimelineEvent[]): Map<number, number> {
  const sorted = [...events].sort((a, b) => {
    const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (pr !== 0) return pr;
    return parseISO(a.start).getTime() - parseISO(b.start).getTime();
  });
  const laneEnds: number[] = []; // last end-time per lane
  const lanes = new Map<number, number>();
  for (const ev of sorted) {
    const s = parseISO(ev.start).getTime();
    const e = parseISO(ev.end).getTime();
    let placed = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] < s) {
        placed = i;
        break;
      }
    }
    if (placed === -1) {
      placed = laneEnds.length;
      laneEnds.push(e);
    } else {
      laneEnds[placed] = e;
    }
    lanes.set(ev.id, placed);
  }
  return lanes;
}
