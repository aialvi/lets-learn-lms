'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { useAuth } from '@/hooks/useAuth';
import { LoadingRegion, Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/auth/signin');
    }
  }, [user, isLoading, router]);

  // Close the mobile drawer on navigation.
  useEffect(() => setSidebarOpen(false), [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setSidebarOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  if (isLoading) {
    return (
      <LoadingRegion label='Loading admin' className='min-h-screen bg-background'>
        <div className='flex h-16 items-center border-b px-4'>
          <Skeleton className='h-6 w-40' />
        </div>
        <div className='flex'>
          <div className='hidden w-64 space-y-2 border-r p-4 lg:block'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-9 w-full' />
            ))}
          </div>
          <div className='flex-1 space-y-6 p-6'>
            <Skeleton className='h-8 w-56' />
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-28' />
              ))}
            </div>
          </div>
        </div>
      </LoadingRegion>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className='min-h-screen w-full bg-background'>
      <Header sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen((open) => !open)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main id='main-content' className='px-4 pb-12 pt-24 sm:px-6 lg:ml-64 lg:px-8'>
        <div className='mx-auto w-full max-w-7xl'>{children}</div>
      </main>
    </div>
  );
}
