'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Info } from 'lucide-react';
import { MainNav } from '@/components/layout/main-nav';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadingRegion, Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { FormAlert } from '@/components/admin/admin-ui';
import { organizationRequest, panel } from '@/lib/organizations';

export default function JoinOrganization() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // null until the URL has been read on the client.
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') || '');
  }, []);

  const callbackUrl = encodeURIComponent(`/organizations/join?token=${token ?? ''}`);

  const accept = async () => {
    if (!session) return;
    setBusy(true);
    setError('');
    try {
      const result = await organizationRequest<{ organizationId: string }>(
        session.accessToken,
        '/invitations/accept',
        'POST',
        { token }
      );
      router.push(`/organizations/${result.organizationId}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='flex min-h-screen flex-col'>
      <MainNav />
      <main id='main-content' className='container-page flex flex-1 items-start justify-center py-12 sm:py-20'>
        <div className={`${panel} w-full max-w-lg`}>
          <span className='flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground'>
            <Building2 aria-hidden='true' className='size-5' />
          </span>
          <div className='space-y-2'>
            <h1 className='text-2xl font-semibold tracking-tight'>Join your organization</h1>
            <p className='text-sm leading-6 text-muted-foreground'>
              Sign in with the email address that received this invitation. Invitations expire after seven days.
            </p>
          </div>

          {token === '' && (
            <Alert variant='info'>
              <Info aria-hidden='true' />
              <AlertDescription>
                This link is missing its invitation code. Open the full invitation link provided by your
                administrator.
              </AlertDescription>
            </Alert>
          )}

          <FormAlert message={error || null} />

          {status === 'loading' ? (
            <LoadingRegion label='Checking your account' className='space-y-3'>
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-9 w-36' />
            </LoadingRegion>
          ) : !session ? (
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Button asChild>
                <Link href={`/auth/signin?callbackUrl=${callbackUrl}`}>Sign in</Link>
              </Button>
              <Button variant='outline' asChild>
                <Link href={`/auth/signup?callbackUrl=${callbackUrl}`}>Create an account</Link>
              </Button>
            </div>
          ) : (
            <div className='space-y-4 border-t pt-4'>
              <p className='text-sm text-muted-foreground'>
                Signed in as <span className='font-medium text-foreground'>{session.user.email}</span>
              </p>
              <Button disabled={!token || busy} onClick={() => void accept()}>
                {busy ? <Spinner /> : null}
                {busy ? 'Joining…' : 'Accept invitation'}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
