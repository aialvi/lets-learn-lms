'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SignInForm } from '@/components/auth/sign-in-form';
import { Footer } from '@/components/layout/footer';
import { MainNav } from '@/components/layout/main-nav';
import { LoadingRegion, Skeleton } from '@/components/ui/skeleton';

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <MainNav />
      <main id='main-content' className='flex flex-1 items-center justify-center px-4 py-12 sm:py-16'>
        {status === 'unauthenticated' ? (
          <SignInForm />
        ) : (
          <LoadingRegion
            label={status === 'authenticated' ? 'Redirecting to your dashboard' : 'Checking your session'}
            className='surface w-full max-w-md space-y-6 p-6 sm:p-8'
          >
            <div className='space-y-3'>
              <Skeleton className='h-3 w-24' />
              <Skeleton className='h-8 w-32' />
              <Skeleton className='h-4 w-full' />
            </div>
            <div className='space-y-4'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
          </LoadingRegion>
        )}
      </main>
      <Footer />
    </div>
  );
}
