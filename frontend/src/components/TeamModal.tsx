import * as React from "react";
import { Users, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n";
import { api, ApiError } from "@/lib/api";
import type { Team } from "@/types";

interface TeamModalProps {
  open: boolean;
  team: Team | null; // null => create
  onClose: () => void;
  onChanged: () => void;
}

const COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899",
  "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#64748b",
];

export function TeamModal({ open, team, onClose, onChanged }: TeamModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const isEdit = !!team;

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState(COLORS[0]);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(team?.name ?? "");
      setDescription(team?.description ?? "");
      setColor(team?.color ?? COLORS[0]);
    }
  }, [open, team]);

  const nameError = name.trim().length === 0;

  const handleSave = async () => {
    if (nameError) {
      toast({ title: t("team.errName"), variant: "error" });
      return;
    }
    setSaving(true);
    const payload = { name: name.trim(), description: description.trim() || null, color };
    try {
      if (isEdit && team) {
        await api.updateTeam(team.id, payload);
        toast({ title: t("toast.teamUpdated"), description: name, variant: "success" });
      } else {
        await api.createTeam(payload);
        toast({ title: t("toast.teamCreated"), description: name, variant: "success" });
      }
      onChanged();
      onClose();
    } catch (e) {
      toast({
        title: t("toast.teamFail"),
        description: e instanceof ApiError ? e.message : t("toast.unexpected"),
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!team) return;
    setDeleting(true);
    try {
      await api.deleteTeam(team.id);
      toast({ title: t("toast.teamDeleted"), description: team.name, variant: "success" });
      setConfirmOpen(false);
      onChanged();
      onClose();
    } catch (e) {
      toast({
        title: t("toast.teamFail"),
        description: e instanceof ApiError ? e.message : t("toast.unexpected"),
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle className="flex items-center gap-2 pr-8">
                {isEdit ? <Pencil className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-primary" />}
                {isEdit ? t("team.edit") : t("team.new")}
              </DialogTitle>
              <DialogDescription>{t("manage.desc")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              <div>
                <Label className="mb-1 block">{t("team.name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("team.namePh")} />
              </div>
              <div>
                <Label className="mb-1 block">{t("team.desc")}</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder={t("team.descPh")} />
              </div>
              <div>
                <Label className="mb-1.5 block">{t("team.color")}</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition ${
                        color === c ? "ring-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
              <div>
                {isEdit && (
                  <Button
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete")}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose} disabled={saving}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleSave} disabled={saving || nameError}>
                  {saving ? t("common.saving") : isEdit ? t("common.save") : t("common.create")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title={t("team.deleteTitle")}
        description={t("team.deleteDesc", { name: team?.name ?? "" })}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
