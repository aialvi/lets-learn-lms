'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, ListVideo, Users } from 'lucide-react';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { AdminPageHeader, getErrorMessage } from '@/components/admin/admin-ui';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingRegion, Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

const sections = [
  { href: '/admin/users', label: 'Manage users', description: 'Create accounts, change roles, and deactivate access.', icon: Users },
  { href: '/admin/courses', label: 'Manage courses', description: 'Edit course details, pricing, and publishing status.', icon: BookOpen },
  { href: '/admin/lessons', label: 'Manage lessons', description: 'Add lessons, reorder content, and attach videos.', icon: ListVideo },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, courses: 0, lessons: 0, enrollments: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't load platform statistics."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  return (
    <div className='space-y-8'>
      <AdminPageHeader
        eyebrow='Overview'
        title='Admin dashboard'
        description='A snapshot of activity across the platform.'
      />

      {isLoading ? (
        <LoadingRegion label='Loading statistics' className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='surface space-y-4 p-5'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-8 w-16' />
            </div>
          ))}
        </LoadingRegion>
      ) : error ? (
        <ErrorState title="Statistics aren't available" message={error} onRetry={fetchStats} />
      ) : (
        <section aria-label='Platform statistics' className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <DashboardCard title='Total users' value={stats.users} icon={Users} />
          <DashboardCard title='Total courses' value={stats.courses} icon={BookOpen} />
          <DashboardCard title='Total lessons' value={stats.lessons} icon={ListVideo} />
          <DashboardCard title='Total enrollments' value={stats.enrollments} icon={GraduationCap} />
        </section>
      )}

      <section aria-labelledby='admin-shortcuts' className='space-y-4'>
        <h2 id='admin-shortcuts' className='text-lg font-semibold'>
          Shortcuts
        </h2>
        <ul className='grid gap-4 md:grid-cols-3'>
          {sections.map(({ href, label, description, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className='surface group flex h-full flex-col gap-3 p-5 transition-colors hover:border-primary/50'
              >
                <span className='flex size-9 items-center justify-center rounded-lg bg-muted text-foreground'>
                  <Icon aria-hidden='true' className='size-4' />
                </span>
                <span className='flex items-center gap-1.5 font-medium'>
                  {label}
                  <ArrowRight
                    aria-hidden='true'
                    className='size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5'
                  />
                </span>
                <span className='text-sm leading-6 text-muted-foreground'>{description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
