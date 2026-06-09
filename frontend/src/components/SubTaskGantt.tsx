import * as React from "react";
import { addDays, format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { contrastText } from "@/lib/utils";
import type { SubTask } from "@/types";
import { buildScale, parseISO, toISO } from "./timeline/scale";
import type { ZoomLevel } from "./timeline/types";

const LEFT_W = 252;
const HEADER_H = 48;
const ROW_H = 46;
const BAR_H = 26;
const MOVE_THRESHOLD = 3;

type DragMode = "move" | "resize-l" | "resize-r";
interface DragState {
  id: number;
  mode: DragMode;
  startClientX: number;
  origStart: Date;
  origEnd: Date;
  deltaDays: number;
  moved: boolean;
}

interface SubTaskGanttProps {
  subtasks: SubTask[];
  rangeStart: Date;
  rangeEnd: Date;
  zoom: ZoomLevel;
  selectedId?: number | null;
  onOpenDetail: (id: number) => void;
  onCommit: (id: number, patch: { start_date?: string; end_date?: string }) => void;
  onTitleCommit: (id: number, title: string) => void;
  onDelete: (id: number) => void;
  busy?: boolean;
}

export function SubTaskGantt({
  subtasks,
  rangeStart,
  rangeEnd,
  zoom,
  selectedId,
  onOpenDetail,
  onCommit,
  onTitleCommit,
  onDelete,
  busy,
}: SubTaskGanttProps) {
  const { t } = useI18n();
  const scale = React.useMemo(
    () => buildScale(rangeStart, rangeEnd, zoom),
    [rangeStart, rangeEnd, zoom]
  );
  const [drag, setDrag] = React.useState<DragState | null>(null);
  const dragRef = React.useRef<DragState | null>(null);
  dragRef.current = drag;

  const today = startOfToday();
  const todayX = scale.xOf(today);
  const todayVisible = today >= rangeStart && today <= rangeEnd;
  const bodyHeight = subtasks.length * ROW_H;

  React.useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const deltaPx = e.clientX - d.startClientX;
      const deltaDays = Math.round(deltaPx / scale.pxPerDay);
      const moved = d.moved || Math.abs(deltaPx) > MOVE_THRESHOLD;
      if (deltaDays !== d.deltaDays || moved !== d.moved) setDrag({ ...d, deltaDays, moved });
    };
    const onUp = () => {
      const d = dragRef.current;
      setDrag(null);
      if (!d) return;
      if (!d.moved) {
        onOpenDetail(d.id); // a click (no drag) opens the sub-task detail popup
        return;
      }
      const { start, end } = applyDrag(d);
      onCommit(d.id, { start_date: toISO(start), end_date: toISO(end) });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, scale.pxPerDay, onCommit, onOpenDetail]);

  const beginDrag = (e: React.PointerEvent, st: SubTask, mode: DragMode) => {
    if (busy) return;
    e.preventDefault();
    e.stopPropagation();
    setDrag({
      id: st.id,
      mode,
      startClientX: e.clientX,
      origStart: parseISO(st.start_date),
      origEnd: parseISO(st.end_date),
      deltaDays: 0,
      moved: false,
    });
  };

  return (
    <div className="tl-scroll overflow-auto rounded-lg border bg-card">
      <div className="relative" style={{ width: LEFT_W + scale.width, minWidth: "100%" }}>
        {/* Header */}
        <div
          className="sticky top-0 z-30 flex border-b bg-card/95 backdrop-blur"
          style={{ height: HEADER_H }}
        >
          <div
            className="sticky left-0 z-40 flex items-center border-r bg-card px-3 text-xs font-semibold"
            style={{ width: LEFT_W }}
          >
            {t("plan.subtaskCount", { count: subtasks.length })}
          </div>
          <div className="relative" style={{ width: scale.width }}>
            {scale.months.map((m, i) => (
              <div
                key={i}
                className="absolute top-0 h-4 truncate border-l px-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
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
                <span className="text-[10px] font-medium leading-none">{tick.label}</span>
                {tick.sublabel && (
                  <span className="text-[8px] uppercase leading-tight text-muted-foreground">
                    {tick.sublabel}
                  </span>
                )}
              </div>
            ))}
            {todayVisible && (
              <div
                className="absolute top-0 z-10 h-4 -translate-x-1/2 rounded-b bg-primary px-1 text-[9px] font-semibold text-primary-foreground"
                style={{ left: todayX }}
              >
                {format(today, "d MMM")}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="relative">
          {/* gridlines + today */}
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
                  borderColor: tick.strong ? "hsl(var(--border))" : "hsl(var(--border) / 0.5)",
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

          {subtasks.map((st, idx) => {
            const isDragging = drag?.id === st.id;
            const active = isDragging ? applyDrag(drag!) : null;
            const startDate = active ? active.start : parseISO(st.start_date);
            const endDate = active ? active.end : parseISO(st.end_date);
            const left = scale.xOf(startDate);
            const dayCount = Math.max(1, daysBetween(startDate, endDate) + 1);
            const width = Math.max(scale.pxPerDay, dayCount * scale.pxPerDay);
            const color = st.color || "#6366f1";
            const selected = selectedId === st.id;
            return (
              <div
                key={st.id}
                className={`flex border-b last:border-b-0 ${selected ? "bg-primary/5" : ""}`}
                style={{ height: ROW_H }}
              >
                {/* left cell: title + duration + delete */}
                <div
                  className="sticky left-0 z-20 flex items-center gap-1.5 border-r bg-card px-2"
                  style={{ width: LEFT_W }}
                >
                  <Input
                    defaultValue={st.title}
                    key={`${st.id}-${st.title}`}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== st.title) onTitleCommit(st.id, v);
                    }}
                    className="h-7 flex-1 text-xs"
                    disabled={busy}
                  />
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {t("plan.days", { days: dayCount })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    title={t("common.delete")}
                    onClick={() => onDelete(st.id)}
                    disabled={busy}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>

                {/* lane with draggable bar */}
                <div className="relative" style={{ width: scale.width }}>
                  {idx % 2 === 1 && <div className="absolute inset-0 bg-muted/30" />}
                  <div
                    onPointerDown={(e) => beginDrag(e, st, "move")}
                    className={`group absolute flex select-none items-center overflow-hidden rounded-md px-2 text-xs font-medium shadow-sm ${
                      isDragging
                        ? "z-30 cursor-grabbing ring-2 ring-primary"
                        : selected
                          ? "z-20 cursor-grab ring-2 ring-primary ring-offset-1 ring-offset-background"
                          : "z-10 cursor-grab"
                    }`}
                    style={{
                      left,
                      width,
                      top: (ROW_H - BAR_H) / 2,
                      height: BAR_H,
                      backgroundColor: color,
                      color: contrastText(color),
                    }}
                  >
                    <span
                      onPointerDown={(e) => beginDrag(e, st, "resize-l")}
                      className="absolute left-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
                      style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
                    />
                    {st.progress > 0 && (
                      <span
                        className="absolute bottom-0 left-0 h-1 rounded-b"
                        style={{ width: `${st.progress}%`, backgroundColor: "rgba(255,255,255,0.7)" }}
                      />
                    )}
                    <span className="truncate">{st.title}</span>
                    <span
                      onPointerDown={(e) => beginDrag(e, st, "resize-r")}
                      className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
                      style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function applyDrag(d: DragState): { start: Date; end: Date } {
  const { mode, deltaDays, origStart, origEnd } = d;
  if (mode === "move") return { start: addDays(origStart, deltaDays), end: addDays(origEnd, deltaDays) };
  if (mode === "resize-l") {
    let start = addDays(origStart, deltaDays);
    if (start > origEnd) start = origEnd;
    return { start, end: origEnd };
  }
  let end = addDays(origEnd, deltaDays);
  if (end < origStart) end = origStart;
  return { start: origStart, end };
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
