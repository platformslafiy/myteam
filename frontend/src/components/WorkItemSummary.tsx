import { format } from "date-fns";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  GitBranch,
  MessageSquare,
  Target,
  User,
  Users,
  Users2,
} from "lucide-react";
import type { Team, TeamMember, WorkItem } from "@/types";
import { useI18n } from "@/lib/i18n";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { Avatar } from "./Avatar";

interface WorkItemSummaryProps {
  item: WorkItem;
  members: TeamMember[];
  teams: Team[];
  allItems: WorkItem[];
}

function TeamChip({ name, color }: { name: string; color: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

function fmt(d: string) {
  try {
    return format(new Date(d), "d MMM yyyy");
  } catch {
    return d;
  }
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

export function WorkItemSummary({ item, members, teams, allItems }: WorkItemSummaryProps) {
  const { t } = useI18n();
  const byId = new Map(members.map((m) => [m.id, m]));
  const teamById = new Map(teams.map((tm) => [tm.id, tm]));
  const owner = item.owner_id ? byId.get(item.owner_id) : undefined;
  const ownerTeam = item.team_id ? teamById.get(item.team_id) : undefined;
  const collabTeams = item.collaborator_team_ids
    .map((id) => teamById.get(id))
    .filter(Boolean) as Team[];
  const deps = item.dependency_ids
    .map((id) => allItems.find((w) => w.id === id))
    .filter(Boolean) as WorkItem[];

  return (
    <div className="space-y-5">
      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={item.status} />
        <PriorityBadge priority={item.priority} />
        <span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          {item.progress}{t("sum.complete")}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${item.progress}%` }}
        />
      </div>

      {item.summary && <p className="text-sm text-muted-foreground">{item.summary}</p>}

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
        <Section icon={<User className="h-3.5 w-3.5" />} label={t("sum.owner")}>
          {owner ? (
            <div className="flex items-center gap-2">
              <Avatar name={owner.full_name} color={owner.avatar_color} size="sm" />
              <div className="text-sm">
                <div className="font-medium">{owner.full_name}</div>
                <div className="text-xs text-muted-foreground">{owner.title}</div>
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{t("sum.unassigned")}</span>
          )}
        </Section>

        <Section icon={<Users2 className="h-3.5 w-3.5" />} label={t("sum.team")}>
          {ownerTeam ? (
            <TeamChip name={ownerTeam.name} color={ownerTeam.color} />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </Section>

        <Section icon={<User className="h-3.5 w-3.5" />} label={t("sum.requester")}>
          <span className="text-sm">{item.requester || "—"}</span>
        </Section>

        <Section icon={<Clock className="h-3.5 w-3.5" />} label={t("sum.effort")}>
          <span className="text-sm">
            {item.estimated_effort_days != null ? `${item.estimated_effort_days} ${t("sum.days")}` : "—"}
          </span>
        </Section>

        <Section icon={<CalendarDays className="h-3.5 w-3.5" />} label={t("sum.start")}>
          <span className="text-sm">{fmt(item.start_date)}</span>
        </Section>

        <Section icon={<CalendarDays className="h-3.5 w-3.5" />} label={t("sum.end")}>
          <span className="text-sm">{fmt(item.end_date)}</span>
        </Section>

        <Section icon={<Users className="h-3.5 w-3.5" />} label={t("sum.support")}>
          {item.assignees.length === 0 ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {item.assignees.map((a) => {
                const m = byId.get(a.member_id);
                if (!m) return null;
                const mTeam = m.team_id ? teamById.get(m.team_id) : undefined;
                return (
                  <span
                    key={a.id}
                    className="flex items-center gap-1.5 rounded-full border bg-background py-0.5 pl-0.5 pr-2 text-xs"
                  >
                    <Avatar name={m.full_name} color={m.avatar_color} size="sm" />
                    {m.full_name}
                    {mTeam && <span className="text-muted-foreground">· {mTeam.name}</span>}
                    {a.role && <span className="text-muted-foreground">· {a.role}</span>}
                  </span>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {item.description && (
        <Section icon={<MessageSquare className="h-3.5 w-3.5" />} label={t("sum.description")}>
          <p className="whitespace-pre-wrap text-sm text-foreground/90">{item.description}</p>
        </Section>
      )}

      {collabTeams.length > 0 && (
        <Section icon={<Users2 className="h-3.5 w-3.5" />} label={t("sum.collabTeams")}>
          <div className="flex flex-wrap gap-2">
            {collabTeams.map((tm) => (
              <TeamChip key={tm.id} name={tm.name} color={tm.color} />
            ))}
          </div>
        </Section>
      )}

      {item.jira_references.length > 0 && (
        <Section icon={<ExternalLink className="h-3.5 w-3.5" />} label={t("sum.jira")}>
          <div className="flex flex-wrap gap-2">
            {item.jira_references.map((j) =>
              j.jira_url ? (
                <a
                  key={j.id}
                  href={j.jira_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs font-medium text-primary hover:bg-accent"
                >
                  {j.jira_code}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span
                  key={j.id}
                  className="rounded-md border bg-background px-2 py-1 text-xs font-medium"
                >
                  {j.jira_code}
                </span>
              )
            )}
          </div>
        </Section>
      )}

      {deps.length > 0 && (
        <Section icon={<GitBranch className="h-3.5 w-3.5" />} label={t("sum.deps")}>
          <div className="flex flex-wrap gap-2">
            {deps.map((d) => (
              <span key={d.id} className="rounded-md border bg-background px-2 py-1 text-xs">
                {d.title}
              </span>
            ))}
          </div>
        </Section>
      )}

      {item.comments.length > 0 && (
        <Section icon={<MessageSquare className="h-3.5 w-3.5" />} label={t("sum.notes")}>
          <div className="space-y-2">
            {item.comments.map((c) => (
              <div key={c.id} className="rounded-md border bg-background p-2 text-sm">
                <p>{c.comment}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.created_by || "Unknown"} · {fmt(c.created_at)}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
        <span>{t("sum.createdBy", { who: item.created_by || "—", date: fmt(item.created_at) })}</span>
        <span>{t("sum.updatedBy", { who: item.updated_by || "—", date: fmt(item.updated_at) })}</span>
      </div>
    </div>
  );
}
