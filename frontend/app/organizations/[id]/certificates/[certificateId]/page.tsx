'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Award, LogIn, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingRegion, Skeleton } from '@/components/ui/skeleton';
import { Certificate, displayDate, Organization, organizationRequest } from '@/lib/organizations';

export default function CertificatePage({ params }: { params: Promise<{ id: string; certificateId: string }> }) {
  const { id, certificateId } = use(params);
  const { data: session, status } = useSession();
  const [data, setData] = useState<{ certificate: Certificate; org: Organization } | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!session?.accessToken) return;
    setError('');
    void Promise.all([
      organizationRequest<Certificate[]>(session.accessToken, `/${id}/certificates`),
      organizationRequest<Organization>(session.accessToken, `/${id}`),
    ])
      .then(([certificates, org]) => {
        const certificate = certificates.find((c) => c.id === certificateId);
        if (!certificate) {
          throw new Error(
            "This certificate doesn't exist in this organization, or you don't have access to it."
          );
        }
        setData({ certificate, org });
      })
      .catch((e) => setError(e.message));
  }, [session?.accessToken, id, certificateId]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === 'unauthenticated') {
    return (
      <main id='main-content' className='container-page py-16'>
        <EmptyState
          icon={LogIn}
          title='Sign in to view this certificate'
          description='Certificates are only visible to members of the issuing organization.'
          action={
            <Button asChild>
              <Link href={`/auth/signin?callbackUrl=/organizations/${id}/certificates/${certificateId}`}>
                Sign in
              </Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main id='main-content' className='mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-8 print:p-0'>
      <div className='flex flex-wrap items-center justify-between gap-3 print:hidden'>
        <Button variant='ghost' asChild className='-ml-3 text-muted-foreground'>
          <Link href={`/organizations/${id}`}>
            <ArrowLeft aria-hidden='true' />
            Back to workspace
          </Link>
        </Button>
        <Button disabled={!data} onClick={() => window.print()}>
          <Printer aria-hidden='true' />
          Print or save as PDF
        </Button>
      </div>

      {error ? (
        <ErrorState
          title="We couldn't load this certificate"
          message={error}
          onRetry={load}
          action={
            <Button asChild variant='ghost'>
              <Link href={`/organizations/${id}`}>Back to workspace</Link>
            </Button>
          }
        />
      ) : !data ? (
        <LoadingRegion
          label='Loading certificate'
          className='flex flex-col items-center gap-6 rounded-2xl border-4 border-muted p-10'
        >
          <Skeleton className='size-16 rounded-full' />
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-10 w-80 max-w-full' />
          <Skeleton className='h-8 w-56' />
          <Skeleton className='h-7 w-72 max-w-full' />
        </LoadingRegion>
      ) : (
        <article className='space-y-8 rounded-2xl border-4 border-primary/30 bg-card p-8 text-center text-card-foreground sm:p-12 print:rounded-none print:border-primary'>
          <Award aria-hidden='true' className='mx-auto size-16 text-primary' />
          <p className='text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground'>{data.org.name}</p>
          <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Certificate of Completion</h1>
          <div className='space-y-3'>
            <p className='text-muted-foreground'>This certifies that</p>
            <p className='text-3xl font-medium'>{data.certificate.user?.username}</p>
            <p className='text-muted-foreground'>has completed</p>
            <h2 className='text-2xl font-semibold'>{data.certificate.courseTitle}</h2>
          </div>
          <dl className='mx-auto grid max-w-md gap-2 border-t pt-6 text-sm'>
            <div>
              <dt className='sr-only'>Issued</dt>
              <dd>
                {data.certificate.legacy
                  ? 'Legacy completion — historical issue date unavailable'
                  : `Issued ${displayDate(data.certificate.issuedAt, data.org.timezone)}`}
              </dd>
            </div>
            {data.certificate.expiresAt && (
              <div>
                <dt className='sr-only'>Expiry</dt>
                <dd>Expires {displayDate(data.certificate.expiresAt, data.org.timezone)}</dd>
              </div>
            )}
            <div>
              <dt className='sr-only'>Credential ID</dt>
              <dd className='break-all font-mono text-xs text-muted-foreground'>
                Credential ID: {data.certificate.id}
              </dd>
            </div>
          </dl>
          <p className='text-sm text-muted-foreground'>Platform-issued training record · Let&apos;s Learn</p>
        </article>
      )}
    </main>
  );
}
