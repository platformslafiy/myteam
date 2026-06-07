import * as React from "react";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { contrastText } from "@/lib/utils";
import { PRIORITY_SYMBOL } from "@/lib/colors";
import { useI18n } from "@/lib/i18n";
import { MemberRow } from "@/components/MemberRow";
import { assignLanes, buildScale, parseISO, type Scale } from "./scale";
import type { TimelineEvent, TimelineProps } from "./types";

const LEFT_W = 252;
const HEADER_H = 56;
const BAR_H = 30;
const V_GAP = 5;
const V_PAD = 9;

export function CustomTimeline({
  resources,
  events,
  zoom,
  rangeStart,
  rangeEnd,
  onEventClick,
  renderTooltip,
}: TimelineProps) {
  const { t } = useI18n();
  const scale = React.useMemo(
    () => buildScale(rangeStart, rangeEnd, zoom),
    [rangeStart, rangeEnd, zoom]
  );

  const rows = React.useMemo(() => {
    return resources.map((res) => {
      const evs = events.filter((e) => e.resourceId === res.id);
      const lanes = assignLanes(evs);
      const laneCount = Math.max(1, ...Array.from(lanes.values()).map((l) => l + 1), 1);
      const height = laneCount * BAR_H + (laneCount - 1) * V_GAP + V_PAD * 2;
      return { res, evs, lanes, laneCount, height };
    });
  }, [resources, events]);

  const bodyHeight = rows.reduce((sum, r) => sum + r.height, 0);
  const today = startOfToday();
  const todayX = scale.xOf(today);
  const todayVisible = today >= rangeStart && today <= rangeEnd;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="tl-scroll overflow-auto rounded-xl border bg-card">
        <div className="relative" style={{ width: LEFT_W + scale.width, minWidth: "100%" }}>
          {/* Header */}
          <div
            className="sticky top-0 z-30 flex border-b bg-card/95 backdrop-blur"
            style={{ height: HEADER_H }}
          >
            <div
              className="sticky left-0 z-40 flex items-center border-r bg-card px-4 text-sm font-semibold"
              style={{ width: LEFT_W }}
            >
              {t("timeline.member")}
            </div>
            <div className="relative" style={{ width: scale.width }}>
              {scale.months.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-5 truncate border-l px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  style={{ left: m.x, width: m.width }}
                >
                  {m.label}
                </div>
              ))}
              {scale.ticks.map((tick, i) => (
                <div
                  key={i}
                  className="absolute bottom-1 flex flex-col items-center"
                  style={{ left: tick.x - 0.5 }}
                >
                  <span className="text-[11px] font-medium leading-none">{tick.label}</span>
                  {tick.sublabel && (
                    <span className="text-[9px] uppercase leading-tight text-muted-foreground">
                      {tick.sublabel}
                    </span>
                  )}
                </div>
              ))}
              {todayVisible && (
                <div
                  className="absolute top-0 z-10 flex h-5 -translate-x-1/2 items-center rounded-b bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground"
                  style={{ left: todayX }}
                >
                  {format(today, "d MMM")}
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="relative">
            {/* Gridlines + today line layer */}
            <div
              className="pointer-events-none absolute top-0 z-0"
              style={{ left: LEFT_W, width: scale.width, height: bodyHeight }}
            >
              {scale.ticks.map((tick, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full border-l"
                  style={{
                    left: tick.x,
                    borderColor: tick.strong
                      ? "hsl(var(--border))"
                      : "hsl(var(--border) / 0.5)",
                  }}
                />
              ))}
              {todayVisible && (
                <div
                  className="absolute top-0 h-full border-l-2 border-primary/70"
                  style={{ left: todayX }}
                />
              )}
            </div>

            {/* Rows */}
            {rows.map(({ res, evs, lanes, height }, rowIdx) => (
              <div key={res.id} className="flex border-b last:border-b-0" style={{ height }}>
                <MemberRow resource={res} width={LEFT_W} />
                <div className="relative" style={{ width: scale.width }}>
                  {rowIdx % 2 === 1 && <div className="absolute inset-0 bg-muted/30" />}
                  {evs.map((ev) => (
                    <Bar
                      key={ev.id}
                      ev={ev}
                      lane={lanes.get(ev.id) ?? 0}
                      scale={scale}
                      onClick={() => onEventClick(ev.id)}
                      renderTooltip={renderTooltip}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// --------------------------------------------------------------------------- //
// Single bar (click-to-open, no drag — editing happens in the modal)
// --------------------------------------------------------------------------- //
function Bar({
  ev,
  lane,
  scale,
  onClick,
  renderTooltip,
}: {
  ev: TimelineEvent;
  lane: number;
  scale: Scale;
  onClick: () => void;
  renderTooltip?: (event: TimelineEvent) => React.ReactNode;
}) {
  const startDate = parseISO(ev.start);
  const endDate = parseISO(ev.end);
  const left = scale.xOf(startDate);
  const dayCount = Math.max(1, daysBetween(startDate, endDate) + 1);
  const width = Math.max(scale.pxPerDay, dayCount * scale.pxPerDay);
  const top = V_PAD + lane * (BAR_H + V_GAP);

  const faded = ev.status === "Completed" || ev.status === "Cancelled";
  const textColor = contrastText(ev.color);

  const bar = (
    <button
      type="button"
      onClick={onClick}
      className={`group absolute flex select-none items-center gap-1 overflow-hidden rounded-md px-1.5 text-xs font-medium shadow-sm transition-all hover:z-20 hover:shadow-md hover:ring-2 hover:ring-offset-1 hover:ring-offset-background ${
        faded ? "opacity-60" : ""
      }`}
      style={{
        left,
        width,
        top,
        height: BAR_H,
        backgroundColor: ev.color,
        color: textColor,
        // @ts-expect-error custom property for ring color
        "--tw-ring-color": ev.color,
      }}
    >
      {/* priority indicator */}
      <span
        className="shrink-0 rounded px-1 text-[10px] font-bold leading-none"
        style={{ backgroundColor: "rgba(0,0,0,0.22)" }}
        title={ev.priority}
      >
        {PRIORITY_SYMBOL[ev.priority]}
      </span>
      {/* progress fill */}
      {ev.progress > 0 && (
        <span
          className="absolute bottom-0 left-0 h-1 rounded-b"
          style={{ width: `${ev.progress}%`, backgroundColor: "rgba(255,255,255,0.7)" }}
        />
      )}
      <span className="truncate">
        {ev.overdue && "⚠ "}
        {ev.title}
      </span>
    </button>
  );

  if (!renderTooltip) return bar;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{bar}</TooltipTrigger>
      <TooltipContent side="top">{renderTooltip(ev)}</TooltipContent>
    </Tooltip>
  );
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
