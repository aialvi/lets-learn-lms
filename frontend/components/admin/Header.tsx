'use client';

import Link from 'next/link';
import { BookOpen, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_SIDEBAR_ID } from '@/components/admin/Sidebar';

interface HeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Header({ sidebarOpen, toggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className='fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6'>
      <div className='flex items-center gap-2'>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggleSidebar}
          className='lg:hidden'
          aria-expanded={sidebarOpen}
          aria-controls={ADMIN_SIDEBAR_ID}
          aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
        >
          {sidebarOpen ? <X aria-hidden='true' /> : <Menu aria-hidden='true' />}
        </Button>
        <Link href='/admin' className='flex items-center gap-2 rounded-md font-semibold tracking-tight'>
          <span className='flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground'>
            <BookOpen aria-hidden='true' className='size-4' />
          </span>
          <span>
            Let&apos;s Learn <span className='font-normal text-muted-foreground'>Admin</span>
          </span>
        </Link>
      </div>
      <div className='flex items-center gap-2'>
        {user ? (
          <span className='hidden text-sm text-muted-foreground sm:inline'>
            Signed in as <span className='font-medium text-foreground'>{user.username}</span>
          </span>
        ) : null}
        <ThemeToggle />
        <Button variant='outline' size='sm' onClick={logout}>
          <LogOut aria-hidden='true' />
          Sign out
        </Button>
      </div>
    </header>
  );
}
