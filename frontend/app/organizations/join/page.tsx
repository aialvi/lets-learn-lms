'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/layout/main-nav';
import { Button } from '@/components/ui/button';
import { organizationRequest, panel } from '@/lib/organizations';
export default function JoinOrganization() {
  const { data: session, status } = useSession(); const router = useRouter();
  const [token, setToken] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get('token') || ''); }, []);
  return <><MainNav /><main className="container-page py-12"><div className={`${panel} max-w-xl mx-auto`}><h1 className="text-2xl font-semibold">Join your organization</h1><p>Sign in with the email address that received this invitation. Invitations expire after seven days.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {status === 'loading' ? <p>Loading…</p> : !session ? <div className="flex gap-3"><Button asChild><Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/organizations/join?token=${token}`)}`}>Sign in</Link></Button><Button variant="outline" asChild><Link href={`/auth/signup?callbackUrl=${encodeURIComponent(`/organizations/join?token=${token}`)}`}>Create an account</Link></Button></div> : <><p>Signed in as {session.user.email}</p><Button disabled={!token || busy} onClick={async () => { setBusy(true); try { const result = await organizationRequest<{ organizationId: string }>(session.accessToken, '/invitations/accept', 'POST', { token }); router.push(`/organizations/${result.organizationId}`); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>{busy ? 'Joining…' : 'Accept invitation'}</Button></>}
    {!token && <p className="text-muted-foreground">Open the full invitation link provided by your administrator.</p>}
  </div></main></>;
}
