"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const order = ["light", "dark", "system"] as const;
type ThemeChoice = (typeof order)[number];

const meta: Record<ThemeChoice, { label: string; Icon: typeof Sun }> = {
  light: { label: "Light", Icon: Sun },
  dark: { label: "Dark", Icon: Moon },
  system: { label: "System", Icon: Monitor },
};

/**
 * Cycles light → dark → system. The accessible name always states the
 * current theme and what activating the button will do.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current: ThemeChoice =
    mounted && order.includes(theme as ThemeChoice) ? (theme as ThemeChoice) : "system";
  const next = order[(order.indexOf(current) + 1) % order.length];
  const { Icon, label } = meta[current];

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("text-muted-foreground hover:text-foreground", className)}
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${label}. Switch to ${meta[next].label.toLowerCase()} theme`}
      title={`Theme: ${label}`}
    >
      <Icon aria-hidden="true" className="size-4" />
    </Button>
  );
}
