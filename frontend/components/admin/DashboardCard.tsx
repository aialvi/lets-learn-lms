import type { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
}

export function DashboardCard({ title, value, icon: Icon }: DashboardCardProps) {
  return (
    <div className='surface p-5'>
      <div className='flex items-start justify-between gap-4'>
        <p className='text-sm font-medium text-muted-foreground'>{title}</p>
        <span className='flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground'>
          <Icon aria-hidden='true' className='size-4' />
        </span>
      </div>
      <p className='mt-3 text-3xl font-semibold tabular-nums tracking-tight text-foreground'>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
