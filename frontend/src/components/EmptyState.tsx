import { CalendarX2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <CalendarX2 className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{t("empty.title")}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("empty.desc")}</p>
      <Button className="mt-5" onClick={onCreate}>
        <Plus className="h-4 w-4" />
        {t("empty.cta")}
      </Button>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="skeleton h-8 w-full rounded" />
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="skeleton h-10 w-56 rounded" />
          <div className="skeleton h-7 flex-1 rounded" style={{ width: `${40 + ((i * 13) % 50)}%` }} />
        </div>
      ))}
    </div>
  );
}
