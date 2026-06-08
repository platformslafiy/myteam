import * as React from "react";
import { addDays, format } from "date-fns";
import { Plus, ListTree, CalendarRange } from "lucide-react";
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
import type { WorkItem } from "@/types";
import { parseISO, toISO } from "./timeline/scale";
import { SubTaskGantt } from "./SubTaskGantt";

interface SubTaskPlanDialogProps {
  open: boolean;
  item: WorkItem;
  onClose: () => void;
  onItemUpdated: (item: WorkItem) => void;
  onChanged: () => void;
}

export function SubTaskPlanDialog({
  open,
  item,
  onClose,
  onItemUpdated,
  onChanged,
}: SubTaskPlanDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [current, setCurrent] = React.useState<WorkItem>(item);
  const [busy, setBusy] = React.useState(false);

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
    return { start: addDays(minS, -3), end: addDays(maxE, 7) };
  }, [current]);

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
      apply(
        await api.createSubtask(current.id, {
          title: t("plan.newSubtask"),
          start_date: start,
          end_date: end,
          position: current.subtasks.length,
        })
      );
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const handleCommit = async (id: number, patch: { start_date?: string; end_date?: string }) => {
    setBusy(true);
    try {
      apply(await api.updateSubtask(id, patch));
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const handleTitle = async (id: number, title: string) => {
    setBusy(true);
    try {
      apply(await api.updateSubtask(id, { title }));
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
      <DialogContent className="max-w-5xl">
        <div className="flex max-h-[92vh] flex-col">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2 pr-8">
              <ListTree className="h-5 w-5 text-primary" />
              {t("plan.title")} — {current.title}
            </DialogTitle>
            <DialogDescription>{t("plan.desc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-6 py-4">
            {/* Computed parent range */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t("plan.parentRange")}:</span>
                <span className="font-semibold">
                  {fmt(current.start_date)} – {fmt(current.end_date)}
                </span>
              </div>
              <Button size="sm" onClick={handleAdd} disabled={busy}>
                <Plus className="h-4 w-4" />
                {t("plan.add")}
              </Button>
            </div>

            {current.subtasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-14 text-center">
                <ListTree className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="max-w-sm text-sm text-muted-foreground">{t("plan.empty")}</p>
                <Button className="mt-4" onClick={handleAdd} disabled={busy}>
                  <Plus className="h-4 w-4" />
                  {t("plan.add")}
                </Button>
              </div>
            ) : (
              <SubTaskGantt
                subtasks={current.subtasks}
                rangeStart={range.start}
                rangeEnd={range.end}
                onCommit={handleCommit}
                onTitleCommit={handleTitle}
                onDelete={handleDelete}
                busy={busy}
              />
            )}
          </div>

          <div className="mt-auto flex justify-end border-t px-6 py-4">
            <Button variant="outline" onClick={onClose}>
              {t("common.close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
