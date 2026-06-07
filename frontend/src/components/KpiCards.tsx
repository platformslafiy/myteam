import {
  Activity,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  ListTodo,
  Ban,
} from "lucide-react";
import type { DashboardSummary } from "@/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface KpiCardsProps {
  summary: DashboardSummary | null;
  loading: boolean;
}

interface Kpi {
  key: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}

export function KpiCards({ summary, loading }: KpiCardsProps) {
  const { t } = useI18n();
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[88px] rounded-xl border bg-card p-4">
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton mt-3 h-7 w-12 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const kpis: Kpi[] = [
    {
      key: "active",
      label: t("kpi.active"),
      value: summary.total_active,
      icon: <Activity className="h-4 w-4" />,
      accent: "text-sky-500 bg-sky-500/10",
    },
    {
      key: "planned",
      label: t("kpi.planned"),
      value: summary.planned,
      icon: <ListTodo className="h-4 w-4" />,
      accent: "text-indigo-500 bg-indigo-500/10",
    },
    {
      key: "overdue",
      label: t("kpi.overdue"),
      value: summary.overdue,
      icon: <CalendarClock className="h-4 w-4" />,
      accent: "text-red-500 bg-red-500/10",
    },
    {
      key: "blocked",
      label: t("kpi.blocked"),
      value: summary.blocked,
      icon: <Ban className="h-4 w-4" />,
      accent: "text-rose-500 bg-rose-500/10",
    },
    {
      key: "week",
      label: t("kpi.week"),
      value: summary.starting_this_week,
      icon: <CalendarRange className="h-4 w-4" />,
      accent: "text-amber-500 bg-amber-500/10",
    },
    {
      key: "month",
      label: t("kpi.month"),
      value: summary.ending_this_month,
      icon: <CheckCircle2 className="h-4 w-4" />,
      accent: "text-emerald-500 bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((k) => (
        <div
          key={k.key}
          className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {k.label}
            </span>
            <span className={cn("rounded-md p-1.5", k.accent)}>{k.icon}</span>
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums">{k.value}</div>
        </div>
      ))}
    </div>
  );
}
