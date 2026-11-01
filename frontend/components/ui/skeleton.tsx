import { cn } from "@/lib/utils";

/** Decorative placeholder. Wrap groups of skeletons in <LoadingRegion>. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted-foreground/12", className)}
      {...props}
    />
  );
}

/**
 * Announces a loading state once to assistive technology while sighted
 * users see skeletons. `label` is read out; children are hidden from AT.
 */
function LoadingRegion({
  label = "Loading",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className} {...props}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export { Skeleton, LoadingRegion };
