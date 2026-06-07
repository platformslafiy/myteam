import { Avatar } from "./Avatar";
import type { TimelineResource } from "./timeline";

/**
 * The left-hand "resource" cell for one timeline row. Kept as its own
 * component so the row presentation can evolve independently of the timeline
 * engine.
 */
export function MemberRow({ resource, width }: { resource: TimelineResource; width: number }) {
  return (
    <div
      className="sticky left-0 z-20 flex items-center gap-3 border-r bg-card px-4"
      style={{ width }}
    >
      <Avatar name={resource.label} color={resource.color} size="md" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{resource.label}</div>
        {resource.sublabel && (
          <div className="truncate text-xs text-muted-foreground">{resource.sublabel}</div>
        )}
      </div>
      {resource.badge && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {resource.badge}
        </span>
      )}
    </div>
  );
}
