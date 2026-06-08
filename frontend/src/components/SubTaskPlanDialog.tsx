import * as React from "react";
import { addDays, format } from "date-fns";
import { Plus, ListTree, CalendarRange, Maximize2, Minimize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SubTaskInput, Team, TeamMember, WorkItem } from "@/types";
import { parseISO, toISO } from "./timeline/scale";
import type { ZoomLevel } from "./timeline/types";
import { SubTaskGantt } from "./SubTaskGantt";
import { SubTaskDetailCard } from "./SubTaskDetailCard";

interface SubTaskPlanDialogProps {
  open: boolean;
  item: WorkItem;
  members: TeamMember[];
  teams: Team[];
  onClose: () => void;
  onItemUpdated: (item: WorkItem) => void;
  onChanged: () => void;
}

const ZOOMS: ZoomLevel[] = ["day", "week", "month", "year"];

export function SubTaskPlanDialog({
  open,
  item,
  members,
  teams,
  onClose,
  onItemUpdated,
  onChanged,
}: SubTaskPlanDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [current, setCurrent] = React.useState<WorkItem>(item);
  const [busy, setBusy] = React.useState(false);
  const [zoom, setZoom] = React.useState<ZoomLevel>("day");
  const [fullscreen, setFullscreen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  // Sync + reset only when the dialog opens or switches to a different item —
  // NOT on every item-object change (sub-task edits update the parent object,
  // and we must keep the current selection through those).
  React.useEffect(() => {
    if (open) {
      setCurrent(item);
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item.id]);

  // Keep the local copy in sync when the parent object changes (same item).
  React.useEffect(() => {
    if (open) setCurrent(item);
  }, [open, item]);

  const range = React.useMemo(() => {
    const starts = current.subtasks.map((s) => parseISO(s.start_date).getTime());
    const ends = current.subtasks.map((s) => parseISO(s.end_date).getTime());
    starts.push(parseISO(current.start_date).getTime());
    ends.push(parseISO(current.end_date).getTime());
    const minS = new Date(Math.min(...starts));
    const maxE = new Date(Math.max(...ends));
    const pad = zoom === "year" ? 60 : zoom === "month" ? 14 : 5;
    return { start: addDays(minS, -pad), end: addDays(maxE, pad + 2) };
  }, [current, zoom]);

  const selected = current.subtasks.find((s) => s.id === selectedId) ?? null;

  const apply = (updated: WorkItem) => {
    setCurrent(updated);
    onItemUpdated(updated);
    onChanged();
  };

  const fail = (e: unknown) =>
    toast({
      title: t("toast.subtaskFail"),
      description: e instanceof ApiError ? e.message : t("toast.unexpected"),
      variant: "error",
    });

  const handleAdd = async () => {
    setBusy(true);
    try {
      const start = current.start_date;
      const end = toISO(addDays(parseISO(start), 3));
      const updated = await api.createSubtask(current.id, {
        title: t("plan.newSubtask"),
        start_date: start,
        end_date: end,
        position: current.subtasks.length,
      });
      apply(updated);
      // select the newly added sub-task
      const added = updated.subtasks[updated.subtasks.length - 1];
      if (added) setSelectedId(added.id);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (id: number, patch: Partial<SubTaskInput>) => {
    setBusy(true);
    try {
      apply(await api.updateSubtask(id, patch));
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    setBusy(true);
    try {
      apply(await api.deleteSubtask(id));
      if (selectedId === id) setSelectedId(null);
      toast({ title: t("toast.subtaskDeleted"), variant: "success" });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const fmt = (d: string) => {
    try {
      return format(new Date(d), "d MMM yyyy");
    } catch {
      return d;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          fullscreen ? "h-[96vh] max-h-[96vh] w-[98vw] max-w-[98vw]" : "max-w-5xl"
        )}
      >
        <div className="flex max-h-[96vh] flex-col">
          <DialogHeader className="border-b px-6 py-4 pr-20">
            <div className="flex items-start justify-between gap-2">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <ListTree className="h-5 w-5 text-primary" />
                  {t("plan.title")} — {current.title}
                </DialogTitle>
                <DialogDescription className="mt-1">{t("plan.desc")}</DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                title={fullscreen ? t("plan.exitFullscreen") : t("plan.fullscreen")}
                onClick={() => setFullscreen((f) => !f)}
              >
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex flex-1 flex-col gap-3 overflow-hidden px-6 py-4">
            {/* Parent range + zoom + add */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t("plan.parentRange")}:</span>
                <span className="font-semibold">
                  {fmt(current.start_date)} – {fmt(current.end_date)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border bg-card p-0.5">
                  {ZOOMS.map((z) => (
                    <button
                      key={z}
                      onClick={() => setZoom(z)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                        zoom === z
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t(`zoom.${z}`)}
                    </button>
                  ))}
                </div>
                <Button size="sm" onClick={handleAdd} disabled={busy}>
                  <Plus className="h-4 w-4" />
                  {t("plan.add")}
                </Button>
              </div>
            </div>

            {current.subtasks.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed py-14 text-center">
                <ListTree className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="max-w-sm text-sm text-muted-foreground">{t("plan.empty")}</p>
                <Button className="mt-4" onClick={handleAdd} disabled={busy}>
                  <Plus className="h-4 w-4" />
                  {t("plan.add")}
                </Button>
              </div>
            ) : (
              <div className="grid flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="min-h-[200px] overflow-hidden">
                  <SubTaskGantt
                    subtasks={current.subtasks}
                    rangeStart={range.start}
                    rangeEnd={range.end}
                    zoom={zoom}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onCommit={handleUpdate}
                    onTitleCommit={(id, title) => handleUpdate(id, { title })}
                    onDelete={handleDelete}
                    busy={busy}
                  />
                </div>
                <div className="overflow-y-auto">
                  {selected ? (
                    <SubTaskDetailCard
                      subtask={selected}
                      members={members}
                      teams={teams}
                      onUpdate={(patch) => handleUpdate(selected.id, patch)}
                      onDelete={() => handleDelete(selected.id)}
                      busy={busy}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {t("plan.selectHint")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t px-6 py-4">
            <Button variant="outline" onClick={onClose}>
              {t("common.close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
