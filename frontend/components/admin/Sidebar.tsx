'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, BookOpen, LayoutDashboard, ListVideo, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/lessons', label: 'Lessons', icon: ListVideo },
];

export const ADMIN_SIDEBAR_ID = 'admin-sidebar';

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop for the mobile drawer */}
      <div
        aria-hidden='true'
        onClick={onClose}
        className={cn(
          'fixed inset-0 top-16 z-20 bg-black/40 transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />
      <aside
        id={ADMIN_SIDEBAR_ID}
        className={cn(
          'fixed bottom-0 left-0 top-16 z-30 flex w-64 flex-col border-r bg-sidebar transition-transform duration-200 lg:translate-x-0',
          isOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full max-lg:invisible'
        )}
      >
        <nav aria-label='Admin' className='flex-1 p-3'>
          <ul className='space-y-1'>
            {navLinks.map((link) => {
              const isActive =
                link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon aria-hidden='true' className='size-4' />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className='border-t p-3'>
          <Link
            href='/dashboard'
            className='flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          >
            <ArrowLeft aria-hidden='true' className='size-4' />
            Back to app
          </Link>
        </div>
      </aside>
    </>
  );
}
