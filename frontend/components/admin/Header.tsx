'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className='fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between border-b bg-card px-4'>
      <div className='flex items-center'>
        <Button variant='ghost' size='icon' onClick={toggleSidebar} className='mr-3'>
          <Menu className='size-4' />
          <span className='sr-only'>Toggle sidebar</span>
        </Button>
        <Link href='/admin' className='text-base font-semibold tracking-tight'>
          Let&apos;s Learn Admin
        </Link>
      </div>
      <div className='flex items-center space-x-4'>
        <div className='hidden text-sm text-muted-foreground sm:block'>
          <span className='font-medium'>
            {user?.username} {user?.role ? `(${user.role})` : ''}
          </span>
        </div>
        <Button variant='outline' size='sm' onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
