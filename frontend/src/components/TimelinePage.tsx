import * as React from "react";
import { addDays, format, startOfMonth } from "date-fns";
import { Plus, Moon, Sun, RefreshCw, CalendarRange, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import {
  EMPTY_FILTERS,
  type Filters,
  type Team,
  type TeamMember,
  type WorkItem,
  type DashboardSummary,
} from "@/types";
import { riskBarColor, STATUS_META, PRIORITY_META } from "@/lib/colors";
import { useTheme } from "./theme-provider";
import { useToast } from "./ui/toast";
import { Button } from "./ui/button";
import { KpiCards } from "./KpiCards";
import { FiltersPanel } from "./FiltersPanel";
import { TimelineToolbar } from "./TimelineToolbar";
import { EmptyState, TimelineSkeleton } from "./EmptyState";
import { WorkItemModal, type ModalMode } from "./WorkItemModal";
import { ManageDialog } from "./ManageDialog";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Timeline, type TimelineEvent, type TimelineResource, type ZoomLevel } from "./timeline";

const UNASSIGNED_ID = -1;
const BACKLOG_BASE = -100000; // synthetic resource ids for per-team backlog rows
const backlogId = (teamId: number) => BACKLOG_BASE - teamId;
const ACTIVE = ["Planned", "In Progress", "Blocked"];

function computeRange(anchor: Date, zoom: ZoomLevel): { start: Date; end: Date } {
  if (zoom === "day") return { start: addDays(anchor, -7), end: addDays(anchor, 35) };
  if (zoom === "week") return { start: addDays(anchor, -21), end: addDays(anchor, 90) };
  const start = startOfMonth(addDays(anchor, -31));
  return { start, end: addDays(start, 365) };
}

function shiftAmount(zoom: ZoomLevel): number {
  return zoom === "day" ? 14 : zoom === "week" ? 35 : 90;
}

function isOverdue(item: WorkItem, today: Date): boolean {
  return ACTIVE.includes(item.status) && new Date(item.end_date) < today;
}

export function TimelinePage() {
  const { theme, toggle } = useTheme();
  const { toast } = useToast();
  const { t, ts, tp } = useI18n();

  const [teams, setTeams] = React.useState<Team[]>([]);
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [items, setItems] = React.useState<WorkItem[]>([]);
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [zoom, setZoom] = React.useState<ZoomLevel>("week");
  const [anchor, setAnchor] = React.useState<Date>(new Date());

  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<ModalMode>("view");
  const [selected, setSelected] = React.useState<WorkItem | null>(null);
  const [manageOpen, setManageOpen] = React.useState(false);

  const range = React.useMemo(() => computeRange(anchor, zoom), [anchor, zoom]);
  const today = React.useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const loadDirectory = React.useCallback(async () => {
    try {
      const [tm, mb] = await Promise.all([api.getTeams(), api.getMembers()]);
      setTeams(tm);
      setMembers(mb);
    } catch (e) {
      toast({
        title: t("toast.loadMembersFail"),
        description: e instanceof ApiError ? e.message : t("toast.unexpected"),
        variant: "error",
      });
    }
  }, [toast, t]);

  const loadItems = React.useCallback(
    async (f: Filters, withSpinner = false) => {
      if (withSpinner) setRefreshing(true);
      try {
        const [w, s] = await Promise.all([api.getWorkItems(f), api.getSummary()]);
        setItems(w);
        setSummary(s);
      } catch (e) {
        toast({
          title: t("toast.loadItemsFail"),
          description: e instanceof ApiError ? e.message : t("toast.unexpected"),
          variant: "error",
        });
      } finally {
        setRefreshing(false);
      }
    },
    [toast, t]
  );

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadDirectory(), loadItems(EMPTY_FILTERS)]);
      setLoading(false);
    })();
  }, [loadDirectory, loadItems]);

  // Debounced refetch on filter change.
  React.useEffect(() => {
    const handle = setTimeout(() => loadItems(filters), 250);
    return () => clearTimeout(handle);
  }, [filters, loadItems]);

  const refetch = React.useCallback(() => loadItems(filters, true), [filters, loadItems]);

  const teamName = React.useCallback(
    (id: number | null) => (id == null ? null : teams.find((tm) => tm.id === id)?.name ?? null),
    [teams]
  );

  // Build resources (rows). Owner rows are derived from the loaded items so
  // every event has a home, plus team members for capacity, plus per-team
  // backlog rows for owner-less items.
  const resources: TimelineResource[] = React.useMemo(() => {
    const counts = new Map<number, number>();
    for (const it of items) {
      if (it.owner_id != null && ACTIVE.includes(it.status)) {
        counts.set(it.owner_id, (counts.get(it.owner_id) ?? 0) + 1);
      }
    }

    const memberRowIds = new Set<number>();
    for (const it of items) if (it.owner_id != null) memberRowIds.add(it.owner_id);
    if (filters.memberId != null) {
      memberRowIds.add(filters.memberId);
    } else if (filters.teamId != null) {
      for (const m of members) if (m.team_id === filters.teamId) memberRowIds.add(m.id);
    } else {
      for (const m of members) memberRowIds.add(m.id);
    }

    const memberById = new Map(members.map((m) => [m.id, m]));
    const memberRows: TimelineResource[] = [...memberRowIds]
      .map((id) => memberById.get(id))
      .filter((m): m is TeamMember => !!m)
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
      .map((m) => ({
        id: m.id,
        label: m.full_name,
        sublabel: [m.title, teamName(m.team_id)].filter(Boolean).join(" · "),
        color: m.avatar_color,
        badge: counts.get(m.id) ? String(counts.get(m.id)) : undefined,
      }));

    // Backlog rows (owner-less items grouped by team).
    const backlogRows: TimelineResource[] = [];
    if (filters.memberId == null) {
      const backlogTeams = new Set<number | null>();
      for (const it of items) if (it.owner_id == null) backlogTeams.add(it.team_id ?? null);
      for (const tid of backlogTeams) {
        if (tid == null) {
          backlogRows.push({
            id: UNASSIGNED_ID,
            label: t("timeline.unassigned"),
            sublabel: t("timeline.backlog"),
            color: "#94a3b8",
          });
        } else {
          const tm = teams.find((x) => x.id === tid);
          backlogRows.push({
            id: backlogId(tid),
            label: `${tm?.name ?? ""} · ${t("timeline.backlog")}`,
            sublabel: t("timeline.backlog"),
            color: tm?.color ?? "#94a3b8",
          });
        }
      }
    }

    return [...memberRows, ...backlogRows];
  }, [members, teams, items, filters.memberId, filters.teamId, teamName, t]);

  const events: TimelineEvent[] = React.useMemo(
    () =>
      items.map((it) => ({
        id: it.id,
        resourceId:
          it.owner_id ?? (it.team_id != null ? backlogId(it.team_id) : UNASSIGNED_ID),
        title: it.title,
        start: it.start_date,
        end: it.end_date,
        color: riskBarColor(it.status, it.end_date, today),
        status: it.status,
        priority: it.priority,
        progress: it.progress,
        overdue: isOverdue(it, today),
      })),
    [items, today]
  );

  const activeFilterCount = React.useMemo(() => {
    let n = 0;
    if (filters.teamId != null) n++;
    if (filters.memberId != null) n++;
    if (filters.project) n++;
    if (filters.status) n++;
    if (filters.priority) n++;
    if (filters.jira) n++;
    if (filters.startAfter) n++;
    if (filters.endBefore) n++;
    return n;
  }, [filters]);

  const openCreate = () => {
    setSelected(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openView = (id: number) => {
    const it = items.find((w) => w.id === id) ?? null;
    if (!it) return;
    setSelected(it);
    setModalMode("view");
    setModalOpen(true);
  };

  const renderTooltip = (ev: TimelineEvent) => {
    const owner = members.find((m) => m.id === ev.resourceId);
    return (
      <div className="space-y-1">
        <div className="font-semibold">{ev.title}</div>
        <div className="text-muted-foreground">
          {format(new Date(ev.start), "d MMM")} – {format(new Date(ev.end), "d MMM yyyy")}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span style={{ color: STATUS_META[ev.status].color }}>● {ts(ev.status)}</span>
          <span style={{ color: PRIORITY_META[ev.priority].color }}>● {tp(ev.priority)}</span>
        </div>
        <div className="text-muted-foreground">
          {ev.progress}
          {t("sum.complete")}
          {owner ? ` · ${owner.full_name}` : ""}
        </div>
        {ev.overdue && <div className="font-medium text-red-400">⚠ {t("overdue")}</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1700px] items-center gap-3 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Team Timeline Planner</h1>
              <p className="text-xs text-muted-foreground">
                {t("app.subtitle", { members: members.length, items: items.length })}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={refetch}
              title={t("header.refresh")}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} title={t("header.theme")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={() => setManageOpen(true)}>
              <Users className="h-4 w-4" />
              {t("header.manage")}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("header.newItem")}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1700px] space-y-4 px-5 py-5">
        <KpiCards summary={summary} loading={loading} />
        <FiltersPanel
          filters={filters}
          members={members}
          teams={teams}
          onChange={setFilters}
          onClear={() => setFilters(EMPTY_FILTERS)}
          activeCount={activeFilterCount}
        />
        <TimelineToolbar
          zoom={zoom}
          onZoomChange={setZoom}
          rangeStart={range.start}
          rangeEnd={range.end}
          onShift={(dir) => setAnchor((a) => addDays(a, dir * shiftAmount(zoom)))}
          onToday={() => setAnchor(new Date())}
        />

        {loading ? (
          <TimelineSkeleton />
        ) : items.length === 0 ? (
          <EmptyState onCreate={openCreate} />
        ) : (
          <Timeline
            resources={resources}
            events={events}
            zoom={zoom}
            rangeStart={range.start}
            rangeEnd={range.end}
            onEventClick={openView}
            renderTooltip={renderTooltip}
          />
        )}
      </main>

      <WorkItemModal
        open={modalOpen}
        mode={modalMode}
        item={selected}
        members={members}
        teams={teams}
        allItems={items}
        onClose={() => setModalOpen(false)}
        onChanged={refetch}
      />

      <ManageDialog
        open={manageOpen}
        teams={teams}
        members={members}
        onClose={() => setManageOpen(false)}
        onChanged={() => {
          loadDirectory();
          refetch();
        }}
      />
    </div>
  );
}
