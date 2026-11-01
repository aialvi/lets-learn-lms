'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowRight, Building2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingRegion, Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { FormAlert } from '@/components/ui/form-alert';
import {
  control,
  fieldLabel,
  moduleNames,
  Organization,
  organizationRequest,
  panel,
} from '@/lib/organizations';

export default function OrganizationsPage() {
  const { data: session, status } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadError, setLoadError] = useState('');
  const [createError, setCreateError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoadError('');
    try {
      setOrganizations(await organizationRequest(session.accessToken, ''));
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const retry = () => {
    setLoading(true);
    void load();
  };

  return (
    <div className='flex min-h-screen flex-col'>
      <MainNav />
      <main id='main-content' className='container-page flex-1 space-y-8 py-10 sm:py-12'>
        <header className='page-header'>
          <div className='space-y-2'>
            <p className='eyebrow'>Your learning spaces</p>
            <h1 className='page-title'>Organizations</h1>
            <p className='page-description'>
              Academic learning and professional development, each with the tools your organization needs.
            </p>
          </div>
        </header>

        {status === 'unauthenticated' ? (
          <EmptyState
            icon={LogIn}
            title='Sign in to see your organizations'
            description='Organizations you belong to, and invitations you have accepted, appear here.'
            action={
              <Button asChild>
                <Link href='/auth/signin?callbackUrl=/organizations'>Sign in</Link>
              </Button>
            }
          />
        ) : (
          <>
            {status === 'loading' || loading ? (
              <LoadingRegion label='Loading organizations' className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={panel}>
                    <div className='flex items-center justify-between'>
                      <Skeleton className='size-9' />
                      <Skeleton className='h-5 w-20' />
                    </div>
                    <Skeleton className='h-6 w-2/3' />
                    <Skeleton className='h-4 w-1/2' />
                    <Skeleton className='h-4 w-3/4' />
                  </div>
                ))}
              </LoadingRegion>
            ) : loadError ? (
              <ErrorState title="Your organizations couldn't be loaded" message={loadError} onRetry={retry} />
            ) : organizations.length === 0 ? (
              <EmptyState
                icon={Building2}
                title='No organizations yet'
                description='Ask your administrator for an invitation link. Once you accept it, the workspace appears here.'
                action={
                  <Button asChild variant='outline'>
                    <Link href='/courses'>Browse public courses</Link>
                  </Button>
                }
              />
            ) : (
              <ul className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {organizations.map((org) => (
                  <li key={org.id}>
                    <Link
                      href={`/organizations/${org.id}`}
                      className={`${panel} group flex h-full flex-col transition-colors hover:border-primary/50`}
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <span className='flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground'>
                          <Building2 aria-hidden='true' className='size-4' />
                        </span>
                        <Badge variant='secondary' className='capitalize'>
                          {org.mode}
                        </Badge>
                      </div>
                      <div className='space-y-1'>
                        <h2 className='text-lg font-semibold'>{org.name}</h2>
                        <p className='text-sm capitalize text-muted-foreground'>
                          {org.role} · {org.timezone}
                        </p>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        Courses{org.modules.length ? ` · ${org.modules.map((m) => moduleNames[m]).join(' · ')}` : ''}
                      </p>
                      <span className='mt-auto flex items-center gap-1.5 pt-2 text-sm font-medium text-primary'>
                        Open workspace
                        <ArrowRight
                          aria-hidden='true'
                          className='size-4 transition-transform group-hover:translate-x-0.5'
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {session?.user.role === 'admin' && (
              <form
                className={`${panel} max-w-xl`}
                aria-labelledby='create-org-heading'
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const data = new FormData(form);
                  setBusy(true);
                  setCreateError('');
                  try {
                    await organizationRequest(session.accessToken, '', 'POST', Object.fromEntries(data));
                    form.reset();
                    toast.success(`Organization “${data.get('name')}” created`);
                    await load();
                  } catch (e) {
                    setCreateError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <div className='space-y-1'>
                  <h2 id='create-org-heading' className='text-lg font-semibold'>
                    Create an organization
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    You&apos;ll be its first administrator. Invite the organization&apos;s owner below.
                  </p>
                </div>
                <FormAlert message={createError || null} />
                <label className={fieldLabel}>
                  Name
                  <input className={control} name='name' required maxLength={120} />
                </label>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <label className={fieldLabel}>
                    Learning mode
                    <select className={control} name='mode' defaultValue='professional'>
                      <option value='professional'>Professional</option>
                      <option value='academic'>Academic</option>
                    </select>
                  </label>
                  <label className={fieldLabel}>
                    Timezone
                    <input
                      className={control}
                      name='timezone'
                      defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
                      required
                    />
                  </label>
                </div>
                <label className={fieldLabel}>
                  Organization admin email
                  <input className={control} name='adminEmail' type='email' autoComplete='off' required />
                </label>
                <Button disabled={busy}>
                  {busy ? <Spinner /> : null}
                  {busy ? 'Creating…' : 'Create organization'}
                </Button>
              </form>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
