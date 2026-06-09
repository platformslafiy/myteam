import * as React from "react";
import { Pencil, Save, Trash2, Plus, ListTree } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n";
import { api, ApiError } from "@/lib/api";
import type { Team, TeamMember, WorkItem } from "@/types";
import { WorkItemSummary } from "./WorkItemSummary";
import { WorkItemForm, type WorkItemFormHandle } from "./WorkItemForm";
import { SubTaskPlanDialog } from "./SubTaskPlanDialog";
import { SubTaskHistoryDialog } from "./SubTaskHistoryDialog";
import type { SubTaskLogInput } from "@/types";

export type ModalMode = "create" | "view";

interface WorkItemModalProps {
  open: boolean;
  mode: ModalMode;
  item: WorkItem | null;
  members: TeamMember[];
  teams: Team[];
  allItems: WorkItem[];
  onClose: () => void;
  onChanged: () => void; // refetch list + dashboard
}

export function WorkItemModal({
  open,
  mode,
  item,
  members,
  teams,
  allItems,
  onClose,
  onChanged,
}: WorkItemModalProps) {
  const { toast } = useToast();
  const { t } = useI18n();
  const formRef = React.useRef<WorkItemFormHandle>(null);
  const [editing, setEditing] = React.useState(mode === "create");
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [formValid, setFormValid] = React.useState(true);
  const [planOpen, setPlanOpen] = React.useState(false);
  const [historyId, setHistoryId] = React.useState<number | null>(null);
  const [logBusy, setLogBusy] = React.useState(false);
  // Local copy of the item so sub-task edits (which change parent dates) reflect
  // immediately in the summary without reopening the modal.
  const [current, setCurrent] = React.useState<WorkItem | null>(item);

  // Reset edit state whenever the modal (re)opens.
  React.useEffect(() => {
    if (open) setEditing(mode === "create");
  }, [open, mode, item?.id]);

  React.useEffect(() => {
    setCurrent(item);
  }, [item]);

  const handleSave = async () => {
    const payload = formRef.current?.collect();
    if (!payload) {
      toast({ title: t("toast.fixFields"), variant: "error" });
      return;
    }
    setSaving(true);
    try {
      let saved: WorkItem;
      if (mode === "create" || !item) {
        saved = await api.createWorkItem(payload);
      } else {
        saved = await api.updateWorkItem(item.id, payload);
      }
      const note = formRef.current?.newNote();
      if (note) {
        await api.addComment(saved.id, note, payload.updated_by ?? undefined);
      }
      toast({
        title: mode === "create" ? t("toast.created") : t("toast.saved"),
        description: saved.title,
        variant: "success",
      });
      onChanged();
      onClose();
    } catch (e) {
      toast({
        title: t("toast.saveFail"),
        description: e instanceof ApiError ? e.message : t("toast.unexpected"),
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setDeleting(true);
    try {
      await api.deleteWorkItem(item.id);
      toast({ title: t("toast.deleted"), description: item.title, variant: "success" });
      setConfirmOpen(false);
      onChanged();
      onClose();
    } catch (e) {
      toast({
        title: t("toast.deleteFail"),
        description: e instanceof ApiError ? e.message : t("toast.unexpected"),
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const historySubtask = current?.subtasks.find((s) => s.id === historyId) ?? null;

  const handleAddLog = async (input: SubTaskLogInput) => {
    if (historyId == null) return;
    setLogBusy(true);
    try {
      const updated = await api.addSubtaskLog(historyId, input);
      setCurrent(updated);
      onChanged();
      toast({ title: t("toast.logSaved"), variant: "success" });
    } catch (e) {
      toast({
        title: t("toast.logFail"),
        description: e instanceof ApiError ? e.message : t("toast.unexpected"),
        variant: "error",
      });
    } finally {
      setLogBusy(false);
    }
  };

  const handleDeleteLog = async (logId: number) => {
    setLogBusy(true);
    try {
      const updated = await api.deleteSubtaskLog(logId);
      setCurrent(updated);
      onChanged();
      toast({ title: t("toast.logDeleted"), variant: "success" });
    } catch (e) {
      toast({
        title: t("toast.logFail"),
        description: e instanceof ApiError ? e.message : t("toast.unexpected"),
        variant: "error",
      });
    } finally {
      setLogBusy(false);
    }
  };

  const title =
    mode === "create"
      ? t("modal.newItem")
      : editing
        ? t("modal.editItem")
        : item?.title ?? t("modal.workItem");

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
          <div className="flex max-h-[92vh] flex-col">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle className="pr-8">{title}</DialogTitle>
              <DialogDescription>
                {mode === "create"
                  ? t("modal.createDesc")
                  : editing
                    ? t("modal.editDesc")
                    : t("modal.viewDesc")}
              </DialogDescription>
            </DialogHeader>

            <div className="tl-scroll flex-1 overflow-y-auto px-6 py-5">
              {editing ? (
                <WorkItemForm
                  ref={formRef}
                  item={mode === "create" ? null : item}
                  members={members}
                  teams={teams}
                  allItems={allItems}
                  onValidityChange={setFormValid}
                />
              ) : current ? (
                <WorkItemSummary
                  item={current}
                  members={members}
                  teams={teams}
                  allItems={allItems}
                  onOpenSubtaskHistory={setHistoryId}
                />
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
              <div className="flex items-center gap-2">
                {mode === "view" && current && !editing && (
                  <>
                    <Button
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setConfirmOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("common.delete")}
                    </Button>
                    <Button variant="secondary" onClick={() => setPlanOpen(true)}>
                      <ListTree className="h-4 w-4" />
                      {t("plan.open")}
                      {current.subtasks.length > 0 && (
                        <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">
                          {current.subtasks.length}
                        </span>
                      )}
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => (mode === "create" ? onClose() : setEditing(false))}
                      disabled={saving}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !formValid}>
                      {mode === "create" ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                      {saving ? t("common.saving") : mode === "create" ? t("common.create") : t("common.save")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={onClose}>
                      {t("common.close")}
                    </Button>
                    <Button onClick={() => setEditing(true)}>
                      <Pencil className="h-4 w-4" />
                      {t("common.edit")}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title={t("modal.deleteTitle")}
        description={t("modal.deleteDesc", { title: item?.title ?? "" })}
        confirmLabel={t("common.delete")}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      {current && (
        <SubTaskPlanDialog
          open={planOpen}
          item={current}
          members={members}
          teams={teams}
          onClose={() => setPlanOpen(false)}
          onItemUpdated={setCurrent}
          onChanged={onChanged}
        />
      )}

      <SubTaskHistoryDialog
        open={historyId != null}
        subtask={historySubtask}
        onClose={() => setHistoryId(null)}
        onAddLog={handleAddLog}
        onDeleteLog={handleDeleteLog}
        busy={logBusy}
      />
    </>
  );
}
