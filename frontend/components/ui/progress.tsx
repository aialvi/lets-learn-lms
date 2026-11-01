import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Accessible progress bar. Exposes role="progressbar" and aria-value*
 * automatically; pass `aria-label` (or `aria-labelledby`) to name it.
 * Callers may still override any ARIA attribute via props.
 */
const Progress = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & {
    value?: number
  }
>(({ className, value, ...props }, ref) => {
  const clamped = Math.min(100, Math.max(0, Math.round(value ?? 0)))
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-valuetext={`${clamped}%`}
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted-foreground/15",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 rounded-full bg-primary transition-transform duration-300"
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }
