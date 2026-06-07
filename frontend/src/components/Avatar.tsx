import { contrastText, initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function Avatar({ name, color, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-background",
        SIZES[size],
        className
      )}
      style={{ backgroundColor: color, color: contrastText(color) }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
