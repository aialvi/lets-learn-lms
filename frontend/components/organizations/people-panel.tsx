'use client';

import { useState } from 'react';
import { Check, Copy, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SelectField } from '@/components/ui/select-field';
import { Spinner } from '@/components/ui/spinner';
import { FormAlert } from '@/components/ui/form-alert';
import { ConfirmAction } from '@/components/organizations/confirm-action';
import { check, control, Department, fieldLabel, Member, panel, Team } from '@/lib/organizations';

type Action = (path: string, body: unknown, method?: string) => Promise<unknown>;

const roles = [
  { value: 'learner', label: 'Learner', description: 'Completes training and earns certificates' },
  { value: 'manager', label: 'Manager', description: 'Assigns training and views team progress' },
  { value: 'instructor', label: 'Instructor', description: 'Creates and edits courses' },
  { value: 'admin', label: 'Admin', description: 'Manages members, courses, and settings' },
];

export function PeoplePanel({
  members,
  teams,
  departments,
  admin,
  teamsEnabled,
  act,
}: {
  members: Member[];
  teams: Team[];
  departments: Department[];
  admin: boolean;
  teamsEnabled: boolean;
  act: Action;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invitation link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy automatically — select the link and copy it manually.");
    }
  };

  return (
    <div className='space-y-6'>
      <FormAlert message={error || null} />

      {admin && (
        <form
          className={panel}
          aria-labelledby='invite-heading'
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = Object.fromEntries(new FormData(form));
            void run(async () => {
              const result = (await act('/invitations', data)) as { invitationUrl: string };
              setInviteUrl(result.invitationUrl);
              setCopied(false);
              form.reset();
            });
          }}
        >
          <div className='space-y-1'>
            <h2 id='invite-heading' className='text-lg font-semibold'>
              Invite a member
            </h2>
            <p className='text-sm text-muted-foreground'>
              We&apos;ll create a link you can share. It&apos;s valid for seven days.
            </p>
          </div>
          <div className='grid gap-4 md:grid-cols-[1fr_12rem_auto] md:items-end'>
            <label className={fieldLabel}>
              Email
              <input className={control} name='email' type='email' autoComplete='off' required />
            </label>
            <SelectField label='Organization role' name='role' defaultValue='learner' options={roles} />
            <Button disabled={busy} className='h-10'>
              {busy ? <Spinner /> : <UserPlus aria-hidden='true' />}
              Create invitation
            </Button>
          </div>
          {inviteUrl && (
            <div className='space-y-1.5 rounded-lg border bg-muted/40 p-4'>
              <label htmlFor='invite-url' className='text-sm font-medium'>
                Invitation link
              </label>
              <div className='flex gap-2'>
                <input
                  id='invite-url'
                  className={`${control} mt-0 font-mono text-xs md:text-xs`}
                  readOnly
                  value={inviteUrl}
                  onFocus={(e) => e.target.select()}
                />
                <Button type='button' variant='outline' className='h-10 shrink-0' onClick={() => void copyInvite()}>
                  {copied ? <Check aria-hidden='true' /> : <Copy aria-hidden='true' />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          )}
        </form>
      )}

      <section className={panel} aria-labelledby='members-heading'>
        <div className='flex items-center justify-between gap-3'>
          <h2 id='members-heading' className='text-lg font-semibold'>
            Members
          </h2>
          <span className='text-sm text-muted-foreground'>{members.length} total</span>
        </div>
        {members.length === 0 ? (
          <EmptyState
            size='sm'
            icon={Users}
            title='No members yet'
            description={admin ? 'Invite people using the form above.' : 'Ask an administrator to invite members.'}
          />
        ) : (
          <div className='-mx-5 overflow-x-auto sm:-mx-6'>
            <table className='w-full text-left text-sm'>
              <caption className='sr-only'>Organization members</caption>
              <thead className='border-y bg-muted/40 text-muted-foreground'>
                <tr>
                  <th scope='col' className='px-4 py-2.5 pl-5 font-medium sm:pl-6'>
                    Name
                  </th>
                  <th scope='col' className='px-4 py-2.5 font-medium'>
                    Role
                  </th>
                  {teamsEnabled && (
                    <th scope='col' className='px-4 py-2.5 font-medium'>
                      Department
                    </th>
                  )}
                  <th scope='col' className='px-4 py-2.5 font-medium'>
                    Status
                  </th>
                  {admin && (
                    <th scope='col' className='px-4 py-2.5 pr-5 text-right font-medium sm:pr-6'>
                      <span className='sr-only'>Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className='divide-y'>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className='px-4 py-3 pl-5 sm:pl-6'>
                      <p className='font-medium'>{member.user.username}</p>
                      <p className='text-muted-foreground'>{member.user.email}</p>
                    </td>
                    <td className='px-4 py-3'>
                      {admin ? (
                        <SelectField
                          aria-label={`Role for ${member.user.username}`}
                          className='min-w-32'
                          size='sm'
                          disabled={busy}
                          value={member.role}
                          onValueChange={(role) => void run(() => act(`/members/${member.id}`, { role }, 'PATCH'))}
                          options={roles}
                        />
                      ) : (
                        <span className='capitalize'>{member.role}</span>
                      )}
                    </td>
                    {teamsEnabled && (
                      <td className='px-4 py-3'>
                        {admin ? (
                          <SelectField
                            aria-label={`Department for ${member.user.username}`}
                            className='min-w-36'
                            size='sm'
                            disabled={busy}
                            value={member.departmentId || ''}
                            onValueChange={(departmentId) =>
                              void run(() =>
                                act(`/members/${member.id}`, { departmentId: departmentId || null }, 'PATCH')
                              )
                            }
                            options={[{ value: '', label: 'Unassigned' }, ...departmentOptions]}
                          />
                        ) : (
                          departments.find((d) => d.id === member.departmentId)?.name || '—'
                        )}
                      </td>
                    )}
                    <td className='px-4 py-3'>
                      <Badge variant={member.active ? 'success' : 'secondary'}>
                        {member.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    {admin && (
                      <td className='px-4 py-3 pr-5 text-right sm:pr-6'>
                        {member.active ? (
                          <ConfirmAction
                            trigger='Deactivate'
                            triggerLabel={`Deactivate ${member.user.username}`}
                            title={`Deactivate ${member.user.username}?`}
                            description="They'll lose access to this workspace until reactivated. Their training history is kept."
                            confirmLabel='Deactivate'
                            disabled={busy}
                            onConfirm={() =>
                              run(() => act(`/members/${member.id}`, { active: false }, 'PATCH'))
                            }
                          />
                        ) : (
                          <Button
                            variant='outline'
                            size='sm'
                            disabled={busy}
                            aria-label={`Reactivate ${member.user.username}`}
                            onClick={() => void run(() => act(`/members/${member.id}`, { active: true }, 'PATCH'))}
                          >
                            Reactivate
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {teamsEnabled && (
        <>
          <section className={panel} aria-labelledby='teams-heading'>
            <h2 id='teams-heading' className='text-lg font-semibold'>
              Teams
            </h2>
            {teams.length === 0 ? (
              <EmptyState
                size='sm'
                icon={Users}
                title='No teams yet'
                description={
                  admin
                    ? 'Create a team below to assign training to a group at once.'
                    : 'An administrator can create teams.'
                }
              />
            ) : (
              <ul className='divide-y'>
                {teams.map((team) => (
                  <li className='flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0' key={team.id}>
                    <div>
                      <p className='font-medium'>{team.name}</p>
                      <p className='text-sm text-muted-foreground'>
                        {team.members.length} {team.members.length === 1 ? 'member' : 'members'} ·{' '}
                        {departments.find((d) => d.id === team.departmentId)?.name || 'No department'}
                      </p>
                    </div>
                    {admin && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setEditingTeam(team)}
                        aria-label={`Edit team ${team.name}`}
                      >
                        Edit
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {admin && (
            <div className='grid gap-6 lg:grid-cols-2 lg:items-start'>
              <form
                className={panel}
                aria-labelledby='department-heading'
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  void run(async () => {
                    await act('/departments', Object.fromEntries(new FormData(form)));
                    form.reset();
                  });
                }}
              >
                <h2 id='department-heading' className='text-lg font-semibold'>
                  Add department
                </h2>
                <label className={fieldLabel}>
                  Department name
                  <input className={control} name='name' required />
                </label>
                <Button disabled={busy}>
                  {busy ? <Spinner /> : null}
                  Add department
                </Button>
              </form>

              <form
                key={editingTeam?.id || 'new'}
                className={panel}
                aria-labelledby='team-form-heading'
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const data = new FormData(form);
                  const selected = data.getAll('members').map(String);
                  const managers = data.getAll('managers').map(String);
                  void run(async () => {
                    await act(
                      editingTeam ? `/teams/${editingTeam.id}` : '/teams',
                      {
                        name: data.get('name'),
                        departmentId: data.get('departmentId') || undefined,
                        members: [...new Set([...selected, ...managers])].map((membershipId) => ({
                          membershipId,
                          isManager: managers.includes(membershipId),
                        })),
                      },
                      editingTeam ? 'PATCH' : 'POST'
                    );
                    setEditingTeam(null);
                    form.reset();
                  });
                }}
              >
                <h2 id='team-form-heading' className='text-lg font-semibold'>
                  {editingTeam ? `Edit team: ${editingTeam.name}` : 'Create team'}
                </h2>
                <label className={fieldLabel}>
                  Team name
                  <input className={control} name='name' required defaultValue={editingTeam?.name} />
                </label>
                <SelectField
                  label='Department'
                  name='departmentId'
                  defaultValue={editingTeam?.departmentId || ''}
                  options={[{ value: '', label: 'No department' }, ...departmentOptions]}
                />
                <fieldset className='space-y-2'>
                  <legend className='mb-2 text-sm font-medium'>Members and managers</legend>
                  <ul className='divide-y rounded-lg border'>
                    {members
                      .filter((m) => m.active)
                      .map((member) => (
                        <li className='flex flex-wrap items-center justify-between gap-2 px-3 py-2.5' key={member.id}>
                          <label className='flex items-center gap-2 text-sm'>
                            <input
                              className={check}
                              type='checkbox'
                              name='members'
                              value={member.id}
                              defaultChecked={editingTeam?.members.some((m) => m.membershipId === member.id)}
                            />
                            {member.user.username}
                          </label>
                          {['manager', 'admin'].includes(member.role) && (
                            <label className='flex items-center gap-2 text-sm text-muted-foreground'>
                              <input
                                className={check}
                                type='checkbox'
                                name='managers'
                                value={member.id}
                                aria-label={`${member.user.username} manages this team`}
                                defaultChecked={editingTeam?.members.some(
                                  (m) => m.membershipId === member.id && m.isManager
                                )}
                              />
                              Manages this team
                            </label>
                          )}
                        </li>
                      ))}
                  </ul>
                </fieldset>
                <div className='flex flex-wrap gap-2'>
                  <Button disabled={busy}>
                    {busy ? <Spinner /> : null}
                    Save team
                  </Button>
                  {editingTeam && (
                    <Button type='button' variant='outline' onClick={() => setEditingTeam(null)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
