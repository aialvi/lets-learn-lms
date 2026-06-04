import type { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
}

export function DashboardCard({ title, value, icon: Icon }: DashboardCardProps) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-4">
        <div className="flex size-11 items-center justify-center rounded-md border bg-background text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
