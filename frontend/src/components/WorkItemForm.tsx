import * as React from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  PRIORITIES,
  STATUSES,
  type Priority,
  type Status,
  type Team,
  type TeamMember,
  type WorkItem,
  type WorkItemInput,
} from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Avatar } from "./Avatar";

export interface WorkItemFormHandle {
  /** Validate + collect the current form values. Returns null if invalid. */
  collect: () => WorkItemInput | null;
  newNote: () => string;
}

interface WorkItemFormProps {
  item: WorkItem | null; // null => create
  members: TeamMember[];
  teams: Team[];
  allItems: WorkItem[];
  onValidityChange?: (valid: boolean) => void;
}

interface JiraRow {
  jira_code: string;
  jira_url: string;
}

const UNASSIGNED = "__none__";

function fieldRow(label: string, node: React.ReactNode, hint?: string) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      {node}
      {hint && <p className="mt-1 text-xs text-destructive">{hint}</p>}
    </div>
  );
}

export const WorkItemForm = React.forwardRef<WorkItemFormHandle, WorkItemFormProps>(
  ({ item, members, teams, allItems, onValidityChange }, ref) => {
    const { t } = useI18n();
    const [title, setTitle] = React.useState(item?.title ?? "");
    const [summary, setSummary] = React.useState(item?.summary ?? "");
    const [description, setDescription] = React.useState(item?.description ?? "");
    const [ownerId, setOwnerId] = React.useState<number | null>(item?.owner_id ?? null);
    const [requester, setRequester] = React.useState(item?.requester ?? "");
    const [startDate, setStartDate] = React.useState(item?.start_date ?? today());
    const [endDate, setEndDate] = React.useState(item?.end_date ?? today());
    const [effort, setEffort] = React.useState<string>(
      item?.estimated_effort_days != null ? String(item.estimated_effort_days) : ""
    );
    const [priority, setPriority] = React.useState<Priority>(item?.priority ?? "Medium");
    const [status, setStatus] = React.useState<Status>(item?.status ?? "Planned");
    const [progress, setProgress] = React.useState<number>(item?.progress ?? 0);
    const [updatedBy, setUpdatedBy] = React.useState(item?.updated_by ?? "");
    const [jira, setJira] = React.useState<JiraRow[]>(
      item?.jira_references.map((j) => ({ jira_code: j.jira_code, jira_url: j.jira_url ?? "" })) ?? []
    );
    const [assignees, setAssignees] = React.useState<{ member_id: number; role: string }[]>(
      item?.assignees.map((a) => ({ member_id: a.member_id, role: a.role ?? "Support" })) ?? []
    );
    const [deps, setDeps] = React.useState<number[]>(item?.dependency_ids ?? []);
    const [collabTeams, setCollabTeams] = React.useState<number[]>(
      item?.collaborator_team_ids ?? []
    );
    const [note, setNote] = React.useState("");

    const dateError = endDate < startDate ? t("form.errDate") : "";
    const titleError = title.trim().length === 0 ? t("form.errTitle") : "";
    const valid = !dateError && !titleError;

    React.useEffect(() => {
      onValidityChange?.(valid);
    }, [valid, onValidityChange]);

    React.useImperativeHandle(ref, () => ({
      collect: () => {
        if (!valid) return null;
        const payload: WorkItemInput = {
          title: title.trim(),
          summary: summary || null,
          description: description || null,
          owner_id: ownerId,
          requester: requester || null,
          start_date: startDate,
          end_date: endDate,
          estimated_effort_days: effort ? Number(effort) : null,
          priority,
          status,
          progress,
          color: null, // bar color is derived from deadline risk
          updated_by: updatedBy || null,
          created_by: item?.created_by ?? (updatedBy || null),
          assignees: assignees.map((a) => ({ member_id: a.member_id, role: a.role || "Support" })),
          collaborator_team_ids: collabTeams,
          jira_references: jira
            .filter((j) => j.jira_code.trim())
            .map((j) => ({ jira_code: j.jira_code.trim(), jira_url: j.jira_url.trim() || null })),
          dependency_ids: deps,
        };
        return payload;
      },
      newNote: () => note.trim(),
    }));

    const availableMembers = members.filter(
      (m) => !assignees.some((a) => a.member_id === m.id)
    );
    const availableDeps = allItems.filter(
      (w) => w.id !== item?.id && !deps.includes(w.id)
    );
    const availableTeams = teams.filter((tm) => !collabTeams.includes(tm.id));
    const byId = new Map(members.map((m) => [m.id, m]));
    const teamById = new Map(teams.map((tm) => [tm.id, tm]));

    return (
      <div className="space-y-4">
        {fieldRow(
          t("form.title"),
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("form.titlePh")} />,
          titleError
        )}

        {fieldRow(
          t("form.summary"),
          <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={t("form.summaryPh")} />
        )}

        {fieldRow(
          t("form.description"),
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder={t("form.descriptionPh")} />
        )}

        <div className="grid grid-cols-2 gap-4">
          {fieldRow(
            t("form.owner"),
            <Select
              value={ownerId == null ? UNASSIGNED : String(ownerId)}
              onValueChange={(v) => setOwnerId(v === UNASSIGNED ? null : Number(v))}
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
          )}
          {fieldRow(
            t("form.requester"),
            <Input value={requester} onChange={(e) => setRequester(e.target.value)} placeholder={t("form.requesterPh")} />
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {fieldRow(
            t("form.start"),
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          )}
          {fieldRow(
            t("form.end"),
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />,
            dateError
          )}
          {fieldRow(
            t("form.effort"),
            <Input type="number" min={0} step={0.5} value={effort} onChange={(e) => setEffort(e.target.value)} />
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {fieldRow(
            t("form.priority"),
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(`priority.${p}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {fieldRow(
            t("form.status"),
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {fieldRow(
            t("form.progress", { value: progress }),
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="mt-2 w-full accent-[hsl(var(--primary))]"
            />
          )}
        </div>

        {/* Collaborating teams */}
        <div>
          <Label className="mb-1 block">{t("form.collabTeams")}</Label>
          <div className="space-y-2">
            {collabTeams.map((id) => {
              const tm = teamById.get(id);
              return (
                <div key={id} className="flex items-center gap-2 rounded-md border bg-background px-2 py-1">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tm?.color ?? "#888" }} />
                  <span className="flex-1 text-sm">{tm?.name ?? `#${id}`}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCollabTeams((p) => p.filter((x) => x !== id))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            {availableTeams.length > 0 && (
              <Select value="" onValueChange={(v) => setCollabTeams((p) => [...p, Number(v)])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("form.addCollabTeam")} />
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

        {/* JIRA references */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label>{t("form.jira")}</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setJira((p) => [...p, { jira_code: "", jira_url: "" }])}
            >
              <Plus className="h-3.5 w-3.5" /> {t("common.add")}
            </Button>
          </div>
          <div className="space-y-2">
            {jira.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("form.jiraNone")}</p>
            )}
            {jira.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  className="w-36"
                  placeholder={t("form.jiraCodePh")}
                  value={row.jira_code}
                  onChange={(e) =>
                    setJira((p) => p.map((r, idx) => (idx === i ? { ...r, jira_code: e.target.value } : r)))
                  }
                />
                <Input
                  className="flex-1"
                  placeholder="https://jira…/browse/CODE-123"
                  value={row.jira_url}
                  onChange={(e) =>
                    setJira((p) => p.map((r, idx) => (idx === i ? { ...r, jira_url: e.target.value } : r)))
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setJira((p) => p.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Support assignees */}
        <div>
          <Label className="mb-1 block">{t("form.assignees")}</Label>
          <div className="space-y-2">
            {assignees.map((a) => {
              const m = byId.get(a.member_id);
              return (
                <div key={a.member_id} className="flex items-center gap-2">
                  {m && <Avatar name={m.full_name} color={m.avatar_color} size="sm" />}
                  <span className="flex-1 text-sm">{m?.full_name ?? "Unknown"}</span>
                  <Input
                    className="w-36"
                    placeholder={t("form.rolePh")}
                    value={a.role}
                    onChange={(e) =>
                      setAssignees((p) =>
                        p.map((x) => (x.member_id === a.member_id ? { ...x, role: e.target.value } : x))
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAssignees((p) => p.filter((x) => x.member_id !== a.member_id))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            {availableMembers.length > 0 && (
              <Select
                value=""
                onValueChange={(v) =>
                  setAssignees((p) => [...p, { member_id: Number(v), role: "Support" }])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("form.addAssignee")} />
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

        {/* Dependencies */}
        <div>
          <Label className="mb-1 block">{t("form.deps")}</Label>
          <div className="space-y-2">
            {deps.map((id) => {
              const w = allItems.find((x) => x.id === id);
              return (
                <div key={id} className="flex items-center gap-2 rounded-md border bg-background px-2 py-1">
                  <span className="flex-1 text-sm">{w?.title ?? `#${id}`}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setDeps((p) => p.filter((x) => x !== id))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            {availableDeps.length > 0 && (
              <Select value="" onValueChange={(v) => setDeps((p) => [...p, Number(v)])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("form.addDep")} />
                </SelectTrigger>
                <SelectContent>
                  {availableDeps.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {fieldRow(
            t("form.note"),
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("form.notePh")} />
          )}
          {fieldRow(
            t("form.updatedBy"),
            <Input value={updatedBy} onChange={(e) => setUpdatedBy(e.target.value)} placeholder={t("form.updatedByPh")} />
          )}
        </div>
      </div>
    );
  }
);
WorkItemForm.displayName = "WorkItemForm";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
