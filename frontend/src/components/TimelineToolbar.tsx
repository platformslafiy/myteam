import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { RISK_COLORS } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { ZoomLevel } from "./timeline";

interface TimelineToolbarProps {
  zoom: ZoomLevel;
  onZoomChange: (z: ZoomLevel) => void;
  rangeStart: Date;
  rangeEnd: Date;
  onShift: (direction: -1 | 1) => void;
  onToday: () => void;
}

export function TimelineToolbar({
  zoom,
  onZoomChange,
  rangeStart,
  rangeEnd,
  onShift,
  onToday,
}: TimelineToolbarProps) {
  const { t } = useI18n();
  const zooms: { key: ZoomLevel; label: string }[] = [
    { key: "day", label: t("zoom.day") },
    { key: "week", label: t("zoom.week") },
    { key: "month", label: t("zoom.month") },
  ];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border bg-card p-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onShift(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={onToday}
            className="flex items-center gap-1.5 px-2 text-sm font-medium hover:text-primary"
          >
            <CalendarDays className="h-4 w-4" />
            {t("toolbar.today")}
          </button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onShift(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          {format(rangeStart, "d MMM yyyy")} – {format(rangeEnd, "d MMM yyyy")}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Deadline-risk legend */}
        <div className="hidden items-center gap-3 lg:flex">
          {[
            { c: RISK_COLORS.normal, k: "legend.normal" },
            { c: RISK_COLORS.risk, k: "legend.risk" },
            { c: RISK_COLORS.completed, k: "legend.completed" },
            { c: RISK_COLORS.cancelled, k: "legend.cancelled" },
          ].map((l) => (
            <span key={l.k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.c }} />
              {t(l.k)}
            </span>
          ))}
        </div>

        {/* Zoom */}
        <div className="flex items-center rounded-lg border bg-card p-0.5">
          {zooms.map((z) => (
            <button
              key={z.key}
              onClick={() => onZoomChange(z.key)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                zoom === z.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
