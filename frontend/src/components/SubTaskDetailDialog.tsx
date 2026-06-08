import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ListTree, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { SubTask, SubTaskInput, Team, TeamMember } from "@/types";
import { SubTaskDetailCard } from "./SubTaskDetailCard";

interface SubTaskDetailDialogProps {
  open: boolean;
  subtask: SubTask | null;
  members: TeamMember[];
  teams: Team[];
  onClose: () => void;
  onUpdate: (patch: Partial<SubTaskInput>) => void;
  onDelete: () => void;
  busy?: boolean;
}

export function SubTaskDetailDialog({
  open,
  subtask,
  members,
  teams,
  onClose,
  onUpdate,
  onDelete,
  busy,
}: SubTaskDetailDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <div className="flex max-h-[92vh] flex-col">
          <DialogHeader className="border-b px-6 py-4 pr-12">
            <DialogTitle className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: subtask?.color || "#6366f1" }}
              />
              {t("plan.detailTitle")}
            </DialogTitle>
            <DialogDescription>{subtask?.title}</DialogDescription>
          </DialogHeader>

          <div className="tl-scroll flex-1 overflow-y-auto px-6 py-5">
            {subtask && (
              <SubTaskDetailCard
                subtask={subtask}
                members={members}
                teams={teams}
                onUpdate={onUpdate}
                busy={busy}
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
              disabled={busy}
            >
              <Trash2 className="h-4 w-4" />
              {t("common.delete")}
            </Button>
            <Button onClick={onClose}>
              <ListTree className="h-4 w-4" />
              {t("common.close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
