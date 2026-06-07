import * as React from "react";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n";
import { api, ApiError } from "@/lib/api";
import type { Team, TeamMember } from "@/types";

interface MemberModalProps {
  open: boolean;
  member: TeamMember | null; // null => create
  teams: Team[];
  onClose: () => void;
  onChanged: () => void;
}

const COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899",
  "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#64748b",
];
const NO_TEAM = "__none__";

export function MemberModal({ open, member, teams, onClose, onChanged }: MemberModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const isEdit = !!member;

  const [fullName, setFullName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [color, setColor] = React.useState(COLORS[0]);
  const [teamId, setTeamId] = React.useState<number | null>(null);
  const [isActive, setIsActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setFullName(member?.full_name ?? "");
      setTitle(member?.title ?? "");
      setDepartment(member?.department ?? "");
      setEmail(member?.email ?? "");
      setColor(member?.avatar_color ?? COLORS[0]);
      setTeamId(member?.team_id ?? null);
      setIsActive(member?.is_active ?? true);
    }
  }, [open, member]);

  const nameError = fullName.trim().length === 0;

  const handleSave = async () => {
    if (nameError) {
      toast({ title: t("member.errName"), variant: "error" });
      return;
    }
    setSaving(true);
    const payload = {
      full_name: fullName.trim(),
      title: title.trim() || null,
      department: department.trim() || null,
      email: email.trim() || null,
      avatar_color: color,
      team_id: teamId,
      is_active: isActive,
    };
    try {
      if (isEdit && member) {
        await api.updateMember(member.id, payload);
        toast({ title: t("toast.memberUpdated"), description: fullName, variant: "success" });
      } else {
        await api.createMember(payload);
        toast({ title: t("toast.memberCreated"), description: fullName, variant: "success" });
      }
      onChanged();
      onClose();
    } catch (e) {
      toast({
        title: t("toast.memberFail"),
        description: e instanceof ApiError ? e.message : t("toast.unexpected"),
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    setDeleting(true);
    try {
      await api.deleteMember(member.id);
      toast({ title: t("toast.memberDeleted"), description: member.full_name, variant: "success" });
      setConfirmOpen(false);
      onChanged();
      onClose();
    } catch (e) {
      toast({
        title: t("toast.memberFail"),
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
                {isEdit ? <Pencil className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
                {isEdit ? t("member.edit") : t("member.new")}
              </DialogTitle>
              <DialogDescription>{t("member.desc")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              <div>
                <Label className="mb-1 block">{t("member.fullName")}</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("member.fullNamePh")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1 block">{t("member.title")}</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("member.titlePh")} />
                </div>
                <div>
                  <Label className="mb-1 block">{t("member.team")}</Label>
                  <Select
                    value={teamId == null ? NO_TEAM : String(teamId)}
                    onValueChange={(v) => setTeamId(v === NO_TEAM ? null : Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_TEAM}>{t("member.noTeam")}</SelectItem>
                      {teams.map((tm) => (
                        <SelectItem key={tm.id} value={String(tm.id)}>
                          {tm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1 block">{t("member.department")}</Label>
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder={t("member.departmentPh")} />
                </div>
                <div>
                  <Label className="mb-1 block">{t("member.email")}</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="demo@example.com" />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">{t("member.color")}</Label>
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
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
                {t("member.active")}
              </label>
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
        title={t("member.deleteTitle")}
        description={t("member.deleteDesc", { name: member?.full_name ?? "" })}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
