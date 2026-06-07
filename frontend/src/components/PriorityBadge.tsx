import { Badge } from "@/components/ui/badge";
import { PRIORITY_META } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Priority } from "@/types";

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const { tp } = useI18n();
  const meta = PRIORITY_META[priority];
  return (
    <Badge className={cn(meta.bg, meta.text, className)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {tp(priority)}
    </Badge>
  );
}
