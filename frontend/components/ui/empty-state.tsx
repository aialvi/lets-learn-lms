import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends Omit<React.ComponentProps<"div">, "title"> {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Primary and/or secondary actions, e.g. <Button>s. */
  action?: React.ReactNode;
  /** Compact variant for use inside cards and table bodies. */
  size?: "default" | "sm";
}

/**
 * Explains why a view is empty and what to do next. Always give the user
 * a way forward via `action` when one exists.
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "default",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed text-center",
        size === "default" ? "gap-4 px-6 py-14" : "gap-3 px-4 py-8",
        className
      )}
      {...props}
    >
      {Icon ? (
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
            size === "default" ? "size-12" : "size-10"
          )}
        >
          <Icon aria-hidden="true" className={size === "default" ? "size-5" : "size-4"} />
        </span>
      ) : null}
      <div className="space-y-1.5">
        <p className={cn("font-semibold text-foreground", size === "default" ? "text-base" : "text-sm")}>
          {title}
        </p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
