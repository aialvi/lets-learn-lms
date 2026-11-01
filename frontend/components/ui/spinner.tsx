import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <>
      <Loader2 aria-hidden="true" className={cn("size-4 animate-spin", className)} />
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  );
}

export { Spinner };
