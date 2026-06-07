import { Search, X, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PRIORITIES, STATUSES, type Filters, type Team, type TeamMember } from "@/types";
import { useI18n } from "@/lib/i18n";

interface FiltersPanelProps {
  filters: Filters;
  members: TeamMember[];
  teams: Team[];
  onChange: (next: Filters) => void;
  onClear: () => void;
  activeCount: number;
}

const ALL = "__all__";

export function FiltersPanel({
  filters,
  members,
  teams,
  onChange,
  onClear,
  activeCount,
}: FiltersPanelProps) {
  const { t } = useI18n();
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 self-center text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          {t("filters.title")}
        </div>

        {/* Project search */}
        <div className="min-w-[180px] flex-1">
          <Label className="mb-1 block">{t("filters.project")}</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.project}
              onChange={(e) => set("project", e.target.value)}
              placeholder={t("filters.projectPh")}
              className="pl-8"
            />
          </div>
        </div>

        {/* Team */}
        <div className="w-[170px]">
          <Label className="mb-1 block">{t("filters.team")}</Label>
          <Select
            value={filters.teamId == null ? ALL : String(filters.teamId)}
            onValueChange={(v) => set("teamId", v === ALL ? null : Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("filters.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("filters.allTeams")}</SelectItem>
              {teams.map((tm) => (
                <SelectItem key={tm.id} value={String(tm.id)}>
                  {tm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Member */}
        <div className="w-[170px]">
          <Label className="mb-1 block">{t("filters.member")}</Label>
          <Select
            value={filters.memberId == null ? ALL : String(filters.memberId)}
            onValueChange={(v) => set("memberId", v === ALL ? null : Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("filters.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("filters.allMembers")}</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="w-[150px]">
          <Label className="mb-1 block">{t("filters.status")}</Label>
          <Select
            value={filters.status ?? ALL}
            onValueChange={(v) => set("status", v === ALL ? null : (v as Filters["status"]))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("filters.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("filters.allStatuses")}</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`status.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="w-[140px]">
          <Label className="mb-1 block">{t("filters.priority")}</Label>
          <Select
            value={filters.priority ?? ALL}
            onValueChange={(v) =>
              set("priority", v === ALL ? null : (v as Filters["priority"]))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("filters.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("filters.allPriorities")}</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {t(`priority.${p}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* JIRA */}
        <div className="w-[130px]">
          <Label className="mb-1 block">{t("filters.jira")}</Label>
          <Input
            value={filters.jira}
            onChange={(e) => set("jira", e.target.value)}
            placeholder={t("filters.jiraPh")}
          />
        </div>

        {/* Date range */}
        <div className="w-[150px]">
          <Label className="mb-1 block">{t("filters.startAfter")}</Label>
          <Input
            type="date"
            value={filters.startAfter ?? ""}
            onChange={(e) => set("startAfter", e.target.value || null)}
          />
        </div>
        <div className="w-[150px]">
          <Label className="mb-1 block">{t("filters.endBefore")}</Label>
          <Input
            type="date"
            value={filters.endBefore ?? ""}
            onChange={(e) => set("endBefore", e.target.value || null)}
          />
        </div>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="self-center">
            <X className="h-4 w-4" />
            {t("filters.clear", { count: activeCount })}
          </Button>
        )}
      </div>
    </div>
  );
}
