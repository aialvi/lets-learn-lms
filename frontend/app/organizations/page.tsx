'use client';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';
import { MainNav } from '@/components/layout/main-nav';
import { Button } from '@/components/ui/button';
import { control, moduleNames, Organization, organizationRequest, panel } from '@/lib/organizations';

export default function OrganizationsPage() {
  const { data: session, status } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!session?.accessToken) return;
    try { setOrganizations(await organizationRequest(session.accessToken, '')); setError(''); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [session?.accessToken]);
  useEffect(() => { void load(); }, [load]);
  return <><MainNav /><main className="container-page py-10 space-y-8">
    <div><p className="text-sm font-medium text-primary">Your learning spaces</p><h1 className="mt-2 text-3xl font-semibold">Organizations</h1><p className="mt-3 text-muted-foreground">Academic learning and professional development, each with the tools your organization needs.</p></div>
    {status === 'unauthenticated' ? <Button asChild><Link href="/auth/signin?callbackUrl=/organizations">Sign in to your organizations</Link></Button> : <>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {loading ? <p role="status">Loading organizations…</p> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{organizations.map(org => <Link key={org.id} href={`/organizations/${org.id}`} className={`${panel} block hover:border-primary transition-colors`}>
        <div className="flex items-center justify-between"><Building2 className="text-primary" /><span className="rounded-full bg-muted px-3 py-1 text-xs capitalize">{org.mode}</span></div>
        <h2 className="text-xl font-semibold">{org.name}</h2><p className="text-sm text-muted-foreground capitalize">{org.role} · {org.timezone}</p><p className="text-sm text-muted-foreground">Courses{org.modules.length ? ` · ${org.modules.map(m => moduleNames[m]).join(' · ')}` : ''}</p><span className="flex items-center gap-2 text-sm font-medium">Open workspace <ArrowRight className="size-4" /></span>
      </Link>)}{!organizations.length && <p>No organizations yet. Accept an invitation from your administrator to get started.</p>}</div>}
      {session?.user.role === 'admin' && <form className={`${panel} max-w-xl`} onSubmit={async event => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); setError(''); try { await organizationRequest(session.accessToken, '', 'POST', Object.fromEntries(data)); form.reset(); await load(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>
        <h2 className="text-xl font-semibold">Create an organization</h2><p className="text-sm text-muted-foreground">You’ll be its first administrator. Invite the organization’s owner below.</p>
        <label className="block space-y-1"><span>Name</span><input className={control} name="name" required maxLength={120} /></label>
        <label className="block space-y-1"><span>Learning mode</span><select className={control} name="mode" defaultValue="professional"><option value="professional">Professional</option><option value="academic">Academic</option></select></label>
        <label className="block space-y-1"><span>Timezone</span><input className={control} name="timezone" defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone} required /></label>
        <label className="block space-y-1"><span>Organization admin email</span><input className={control} name="adminEmail" type="email" required /></label>
        <Button disabled={busy}>{busy ? 'Creating…' : 'Create organization'}</Button>
      </form>}
    </>}
  </main></>;
}
