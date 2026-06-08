import * as React from "react";
import { format } from "date-fns";
import { History, Plus, Trash2, Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import type { SubTask, SubTaskLogInput } from "@/types";

interface SubTaskHistoryDialogProps {
  open: boolean;
  subtask: SubTask | null;
  onClose: () => void;
  onAddLog: (input: SubTaskLogInput) => void;
  onDeleteLog: (logId: number) => void;
  busy?: boolean;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function SubTaskHistoryDialog({
  open,
  subtask,
  onClose,
  onAddLog,
  onDeleteLog,
  busy,
}: SubTaskHistoryDialogProps) {
  const { t } = useI18n();
  const [date, setDate] = React.useState(todayISO());
  const [note, setNote] = React.useState("");
  const [progress, setProgress] = React.useState<string>("");

  React.useEffect(() => {
    if (open) {
      setDate(todayISO());
      setNote("");
      setProgress("");
    }
  }, [open, subtask?.id]);

  const logs = subtask?.logs ?? [];
  const canSave = note.trim().length > 0 && !busy;

  const handleSave = () => {
    if (!canSave) return;
    onAddLog({
      log_date: date,
      note: note.trim(),
      progress: progress === "" ? null : Math.max(0, Math.min(100, Number(progress))),
    });
    setNote("");
    setProgress("");
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
      <DialogContent className="max-w-2xl">
        <div className="flex max-h-[92vh] flex-col">
          <DialogHeader className="border-b px-6 py-4 pr-12">
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {t("hist.title")}
            </DialogTitle>
            <DialogDescription>
              {t("hist.subtitle", { title: subtask?.title ?? "" })}
            </DialogDescription>
          </DialogHeader>

          <div className="tl-scroll flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Add form */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_1fr_120px]">
                <div>
                  <Label className="mb-1 block">{t("hist.date")}</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={busy} />
                </div>
                <div>
                  <Label className="mb-1 block">{t("hist.note")}</Label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("hist.notePh")}
                    disabled={busy}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  />
                </div>
                <div>
                  <Label className="mb-1 block">{t("hist.progress")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => setProgress(e.target.value)}
                    placeholder="%"
                    disabled={busy}
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={handleSave} disabled={!canSave}>
                  <Plus className="h-4 w-4" />
                  {t("hist.add")}
                </Button>
              </div>
            </div>

            {/* Timeline */}
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
                <History className="mb-2 h-7 w-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t("hist.empty")}</p>
              </div>
            ) : (
              <div className="relative pl-7">
                <div className="absolute bottom-2 left-[10px] top-2 w-px bg-border" />
                {logs.map((log) => (
                  <div key={log.id} className="group relative pb-5 last:pb-0">
                    <div className="absolute -left-[22px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary ring-4 ring-background">
                      <Flag className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-semibold">{fmt(log.log_date)}</span>
                        {log.progress != null && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            %{log.progress}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => onDeleteLog(log.id)}
                          disabled={busy}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-foreground/90">{log.note}</p>
                    </div>
                  </div>
                ))}
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
