import * as React from "react";
import { X, User, Users, CalendarDays, Trash2, Clock } from "lucide-react";
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
import { useI18n } from "@/lib/i18n";
import type { SubTask, SubTaskInput, Team, TeamMember } from "@/types";
import { Avatar } from "./Avatar";

interface SubTaskDetailCardProps {
  subtask: SubTask;
  members: TeamMember[];
  teams: Team[];
  onUpdate: (patch: Partial<SubTaskInput>) => void;
  onDelete: () => void;
  busy?: boolean;
}

const UNASSIGNED = "__none__";

function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  const da = new Date(y1, m1 - 1, d1).getTime();
  const db = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((db - da) / 86400000) + 1;
}

export function SubTaskDetailCard({
  subtask,
  members,
  teams,
  onUpdate,
  onDelete,
  busy,
}: SubTaskDetailCardProps) {
  const { t } = useI18n();
  const memberById = new Map(members.map((m) => [m.id, m]));
  const teamById = new Map(teams.map((tm) => [tm.id, tm]));

  const assigneeIds = subtask.assignees.map((a) => a.member_id);
  const availableMembers = members.filter((m) => !assigneeIds.includes(m.id));
  const availableTeams = teams.filter((tm) => !subtask.team_ids.includes(tm.id));
  const duration = daysBetween(subtask.start_date, subtask.end_date);

  const [progress, setProgress] = React.useState(subtask.progress);
  React.useEffect(() => setProgress(subtask.progress), [subtask.id, subtask.progress]);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subtask.color || "#6366f1" }} />
          {t("plan.detailTitle")}
        </h4>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete} disabled={busy}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="mb-1 block">{t("form.title")}</Label>
          <Input
            key={`title-${subtask.id}`}
            defaultValue={subtask.title}
            disabled={busy}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== subtask.title) onUpdate({ title: v });
            }}
          />
        </div>

        {/* Dates via native calendar pickers */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="mb-1 flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> {t("plan.start")}
            </Label>
            <Input
              type="date"
              value={subtask.start_date}
              disabled={busy}
              max={subtask.end_date}
              onChange={(e) => e.target.value && onUpdate({ start_date: e.target.value })}
            />
          </div>
          <div>
            <Label className="mb-1 flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> {t("plan.end")}
            </Label>
            <Input
              type="date"
              value={subtask.end_date}
              disabled={busy}
              min={subtask.start_date}
              onChange={(e) => e.target.value && onUpdate({ end_date: e.target.value })}
            />
          </div>
          <div>
            <Label className="mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> {t("plan.days", { days: "" }).trim() || "Süre"}
            </Label>
            <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm tabular-nums">
              {t("plan.days", { days: duration })}
            </div>
          </div>
        </div>

        {/* Owner */}
        <div>
          <Label className="mb-1 flex items-center gap-1">
            <User className="h-3 w-3" /> {t("plan.owner")}
          </Label>
          <Select
            value={subtask.owner_id == null ? UNASSIGNED : String(subtask.owner_id)}
            onValueChange={(v) => onUpdate({ owner_id: v === UNASSIGNED ? null : Number(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>{t("common.unassigned")}</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Working members */}
        <div>
          <Label className="mb-1 flex items-center gap-1">
            <Users className="h-3 w-3" /> {t("plan.members")}
          </Label>
          <div className="space-y-1.5">
            {subtask.assignees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {subtask.assignees.map((a) => {
                  const m = memberById.get(a.member_id);
                  if (!m) return null;
                  return (
                    <span
                      key={a.id}
                      className="flex items-center gap-1.5 rounded-full border bg-background py-0.5 pl-0.5 pr-1.5 text-xs"
                    >
                      <Avatar name={m.full_name} color={m.avatar_color} size="sm" />
                      {m.full_name}
                      <button
                        className="ml-0.5 rounded p-0.5 hover:bg-accent"
                        disabled={busy}
                        onClick={() =>
                          onUpdate({ assignee_ids: assigneeIds.filter((id) => id !== a.member_id) })
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {availableMembers.length > 0 && (
              <Select value="" onValueChange={(v) => onUpdate({ assignee_ids: [...assigneeIds, Number(v)] })}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={t("plan.addMember")} />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Teams */}
        <div>
          <Label className="mb-1 flex items-center gap-1">
            <Users className="h-3 w-3" /> {t("plan.teams")}
          </Label>
          <div className="space-y-1.5">
            {subtask.team_ids.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {subtask.team_ids.map((id) => {
                  const tm = teamById.get(id);
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1.5 rounded-md border bg-background px-1.5 py-0.5 text-xs"
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tm?.color ?? "#888" }} />
                      {tm?.name ?? `#${id}`}
                      <button
                        className="ml-0.5 rounded p-0.5 hover:bg-accent"
                        disabled={busy}
                        onClick={() => onUpdate({ team_ids: subtask.team_ids.filter((x) => x !== id) })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {availableTeams.length > 0 && (
              <Select value="" onValueChange={(v) => onUpdate({ team_ids: [...subtask.team_ids, Number(v)] })}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={t("plan.addTeam")} />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((tm) => (
                    <SelectItem key={tm.id} value={String(tm.id)}>
                      {tm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Progress */}
        <div>
          <Label className="mb-1 block">
            {t("plan.progress")} ({progress}%)
          </Label>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            disabled={busy}
            onChange={(e) => setProgress(Number(e.target.value))}
            onPointerUp={() => progress !== subtask.progress && onUpdate({ progress })}
            className="w-full accent-[hsl(var(--primary))]"
          />
        </div>
      </div>
    </div>
  );
}
