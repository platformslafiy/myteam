import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Status } from "@/types";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const { ts } = useI18n();
  const meta = STATUS_META[status];
  return (
    <Badge className={cn(meta.bg, meta.text, className)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {ts(status)}
    </Badge>
  );
}
