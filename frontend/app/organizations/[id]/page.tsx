'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  Building2,
  ClipboardList,
  Download,
  Inbox,
  LogIn,
  Plus,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { MainNav } from '@/components/layout/main-nav';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SelectField } from '@/components/ui/select-field';
import { LoadingRegion, Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { FormAlert } from '@/components/admin/admin-ui';
import {
  Certificate,
  check,
  control,
  Course,
  Cycle,
  Delivery,
  Department,
  displayDate,
  fieldLabel,
  Member,
  Notice,
  Organization,
  organizationRequest,
  panel,
  Report,
  Team,
} from '@/lib/organizations';
import { CourseEditor } from '@/components/organizations/course-editor';
import { LearnerTraining } from '@/components/organizations/learner-training';
import { PeoplePanel } from '@/components/organizations/people-panel';
import { SettingsPanel } from '@/components/organizations/settings-panel';
import { ConfirmAction } from '@/components/organizations/confirm-action';

interface Assignment {
  id: string;
  userId: string;
  cancelledAt: string | null;
  course: { title: string };
  cycles: { dueAt: string | null; completedAt: string | null }[];
}
interface Data {
  org: Organization;
  organizations: Organization[];
  courses: Course[];
  cycles: Cycle[];
  members: Member[];
  teams: Team[];
  departments: Department[];
  certificates: Certificate[];
  notices: Notice[];
  deliveries: Delivery[];
  assignments: Assignment[];
}

const reportStatusVariant: Record<string, BadgeProps['variant']> = {
  completed: 'success',
  'in-progress': 'info',
  overdue: 'destructive',
  cancelled: 'secondary',
};

function WorkspaceSkeleton() {
  return (
    <LoadingRegion label='Loading workspace' className='space-y-6'>
      <Skeleton className='h-4 w-32' />
      <div className='space-y-3'>
        <Skeleton className='h-4 w-40' />
        <Skeleton className='h-9 w-72 max-w-full' />
        <Skeleton className='h-4 w-56' />
      </div>
      <div className='flex gap-2 border-b pb-3'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-9 w-28' />
        ))}
      </div>
      <Skeleton className='h-44 w-full rounded-xl' />
      <div className='grid gap-4 md:grid-cols-2'>
        <Skeleton className='h-32 rounded-xl' />
        <Skeleton className='h-32 rounded-xl' />
      </div>
    </LoadingRegion>
  );
}

export default function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState('training');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<Course | 'new' | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [coach, setCoach] = useState('');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const token = session?.accessToken || '';

  const api = useCallback(
    <T,>(path: string, method = 'GET', body?: unknown) => organizationRequest<T>(token, `/${id}${path}`, method, body),
    [token, id]
  );

  const load = useCallback(async () => {
    if (!token) return;
    const org = await api<Organization>('');
    const managing = ['admin', 'manager'].includes(org.role);
    const admin = org.role === 'admin';
    const [organizations, courses, cycles, members, teams, departments, certificates, notices, deliveries, assignments] =
      await Promise.all([
        organizationRequest<Organization[]>(token, ''),
        api<Course[]>('/courses'),
        api<Cycle[]>('/training'),
        managing ? api<Member[]>('/members') : [],
        org.modules.includes('teams') ? api<Team[]>('/teams') : [],
        managing && org.modules.includes('teams') ? api<Department[]>('/departments') : [],
        org.modules.includes('certifications') ? api<Certificate[]>('/certificates') : [],
        org.modules.includes('reminders') ? api<Notice[]>('/notifications') : [],
        admin ? api<Delivery[]>('/deliveries') : [],
        managing && org.modules.includes('teams') ? api<Assignment[]>('/assignments') : [],
      ]);
    setData({ org, organizations, courses, cycles, members, teams, departments, certificates, notices, deliveries, assignments });
  }, [api, token]);

  const initialLoad = useCallback(() => {
    setData(null);
    setLoadError('');
    void load().catch((e) => setLoadError(e.message));
  }, [load]);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();

  useEffect(() => {
    if (tab === 'reports' && data?.org.modules.includes('reports')) {
      setReport(null);
      let current = true;
      void api<Report>(`/reports?${query}`)
        .then((result) => {
          if (current) setReport(result);
        })
        .catch((e) => {
          if (current) setError(e.message);
        });
      return () => {
        current = false;
      };
    }
  }, [tab, query, api, data]);

  const act = async (path: string, body?: unknown, method = 'POST') => {
    const result = await api(path, method, body);
    await load();
    toast.success('Changes saved');
    return result;
  };

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

  if (status === 'unauthenticated') {
    return (
      <>
        <MainNav />
        <main id='main-content' className='container-page py-16'>
          <EmptyState
            icon={LogIn}
            title='Sign in to your workspace'
            description='Your training, courses, and certificates for this organization are available after you sign in.'
            action={
              <Button asChild>
                <Link href={`/auth/signin?callbackUrl=/organizations/${id}`}>Sign in</Link>
              </Button>
            }
          />
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <MainNav />
        <main id='main-content' className='container-page py-8'>
          {loadError ? (
            <ErrorState
              title="This workspace couldn't be opened"
              message={loadError}
              onRetry={initialLoad}
              action={
                <Button asChild variant='ghost'>
                  <Link href='/organizations'>Back to organizations</Link>
                </Button>
              }
            />
          ) : (
            <WorkspaceSkeleton />
          )}
        </main>
      </>
    );
  }

  const { org } = data;
  const admin = org.role === 'admin';
  const managing = admin || org.role === 'manager';
  const teaching = admin || org.role === 'instructor';
  const has = (module: string) => org.modules.includes(module);
  const unread = data.notices.filter((n) => !n.readAt).length;

  const tabs = [
    { id: 'training', label: org.mode === 'professional' ? 'My training' : 'My learning', icon: BookOpen },
    { id: 'courses', label: 'Course catalog', icon: Building2 },
    { id: 'coach', label: 'AI coach', icon: Brain },
    ...(managing
      ? [{ id: 'people', label: org.mode === 'professional' ? 'People & teams' : 'Members & groups', icon: Users }]
      : []),
    ...(has('certifications') ? [{ id: 'certificates', label: 'Certifications', icon: Award }] : []),
    ...(has('reports') && managing ? [{ id: 'reports', label: 'Progress reports', icon: BarChart3 }] : []),
    ...(has('reminders') ? [{ id: 'inbox', label: 'Inbox', icon: Bell }] : []),
    ...(admin ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
  ];
  const activeTab = tabs.some((t) => t.id === tab) ? tab : 'training';

  const selectTab = (next: string) => {
    setTab(next);
    setError('');
  };

  // Arrow-key navigation between tabs (WAI-ARIA tabs pattern, automatic activation).
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const index = tabs.findIndex((t) => t.id === activeTab);
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    event.preventDefault();
    selectTab(tabs[next].id);
    tabRefs.current[tabs[next].id]?.focus();
  };

  const exportCsv = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/organizations/${id}/reports.csv?${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error("The report couldn't be exported. Try again, or narrow the filters.");
    const url = URL.createObjectURL(await response.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = 'training-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const assignableTeams = data.teams.filter(
    (t) =>
      admin ||
      t.members.some(
        (m) => m.isManager && data.members.find((member) => member.id === m.membershipId)?.userId === session?.user.id
      )
  );

  return (
    <>
      <MainNav />
      <main id='main-content' className='container-page space-y-6 py-8'>
        <Button variant='ghost' size='sm' asChild className='-ml-2 text-muted-foreground'>
          <Link href='/organizations'>
            <ArrowLeft aria-hidden='true' />
            All organizations
          </Link>
        </Button>

        <header className='flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between'>
          <div className='space-y-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='secondary' className='capitalize'>
                {org.mode} workspace
              </Badge>
              <Badge variant='outline' className='capitalize'>
                {org.role}
              </Badge>
            </div>
            <h1 className='page-title'>{org.name}</h1>
            <p className='text-sm text-muted-foreground'>All deadlines are shown in {org.timezone}.</p>
          </div>
          {data.organizations.length > 1 && (
            <SelectField
              label='Switch organization'
              className='sm:w-64'
              value={id}
              onValueChange={(next) => next !== id && router.push(`/organizations/${next}`)}
              options={data.organizations.map((o) => ({ value: o.id, label: o.name }))}
            />
          )}
        </header>

        <div
          role='tablist'
          aria-label='Workspace sections'
          className='-mx-4 flex gap-1 overflow-x-auto border-b px-4 pb-px sm:mx-0 sm:px-0'
        >
          {tabs.map((item) => {
            const selected = activeTab === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  tabRefs.current[item.id] = el;
                }}
                type='button'
                role='tab'
                id={`tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`panel-${item.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(item.id)}
                onKeyDown={onTabKeyDown}
                className={`-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                <item.icon aria-hidden='true' className='size-4' />
                {item.label}
                {item.id === 'inbox' && unread > 0 && (
                  <Badge className='h-5 min-w-5 justify-center rounded-full px-1.5'>
                    {unread}
                    <span className='sr-only'> unread</span>
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <div
          role='tabpanel'
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
          className='space-y-6 rounded-md focus-visible:outline-offset-4'
        >
          <FormAlert message={error || null} />

          {activeTab === 'training' && (
            <>
              <LearnerTraining
                cycles={data.cycles}
                timezone={org.timezone}
                act={async (path, body) => {
                  await act(path, body);
                }}
                browseCourses={() => selectTab('courses')}
              />
              {id === 'default-academic' && (
                <p className='text-sm text-muted-foreground'>
                  Your existing academic enrollments remain available in the{' '}
                  <Link className='link' href='/dashboard'>
                    learner dashboard
                  </Link>
                  .
                </p>
              )}
            </>
          )}

          {activeTab === 'courses' && (
            <div className='space-y-6'>
              {editor ? (
                <CourseEditor
                  key={editor === 'new' ? 'new' : editor.id}
                  initial={editor === 'new' ? undefined : editor}
                  enabled={org.modules}
                  cancel={() => setEditor(null)}
                  save={async (body, courseId) => {
                    await act(courseId ? `/courses/${courseId}` : '/courses', body, courseId ? 'PATCH' : 'POST');
                    setEditor(null);
                  }}
                />
              ) : (
                <>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <h2 className='text-lg font-semibold'>Course catalog</h2>
                      <p className='text-sm text-muted-foreground'>
                        {data.courses.length} {data.courses.length === 1 ? 'course' : 'courses'} available in this
                        workspace.
                      </p>
                    </div>
                    {teaching && data.courses.length > 0 && (
                      <Button onClick={() => setEditor('new')}>
                        <Plus aria-hidden='true' />
                        Create course
                      </Button>
                    )}
                  </div>

                  {data.courses.length === 0 ? (
                    <EmptyState
                      icon={BookOpen}
                      title='No courses yet'
                      description={
                        teaching
                          ? 'Create the first course for this workspace. You can add lessons, a quiz, and certification.'
                          : 'An instructor or administrator needs to create the first course.'
                      }
                      action={
                        teaching ? (
                          <Button onClick={() => setEditor('new')}>
                            <Plus aria-hidden='true' />
                            Create course
                          </Button>
                        ) : undefined
                      }
                    />
                  ) : (
                    <ul className='grid gap-4 md:grid-cols-2'>
                      {data.courses.map((course) => (
                        <li key={course.id}>
                          <article className={`${panel} flex h-full flex-col`}>
                            <div className='space-y-2'>
                              <h3 className='text-lg font-semibold'>{course.title}</h3>
                              {course.description && (
                                <p className='line-clamp-3 text-sm leading-6 text-muted-foreground'>
                                  {course.description}
                                </p>
                              )}
                            </div>
                            <div className='flex flex-wrap gap-2'>
                              <Badge variant='secondary'>
                                {course.lessons.length} {course.lessons.length === 1 ? 'lesson' : 'lessons'}
                              </Badge>
                              {course.quiz && has('assessments') && <Badge variant='info'>Quiz</Badge>}
                              {course.certificationEnabled && has('certifications') && (
                                <Badge variant='success'>
                                  {course.validityMonths
                                    ? `${course.validityMonths}-month certification`
                                    : 'Completion certificate'}
                                </Badge>
                              )}
                            </div>
                            <div className='mt-auto flex flex-wrap gap-2 pt-2'>
                              <Button
                                disabled={busy}
                                onClick={() =>
                                  void run(async () => {
                                    await act(`/courses/${course.id}/enroll`, {});
                                    setTab('training');
                                  })
                                }
                              >
                                Start learning
                              </Button>
                              {course.canEdit && (
                                <Button
                                  variant='outline'
                                  onClick={() => setEditor(course)}
                                  aria-label={`Edit course ${course.title}`}
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
                          </article>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {managing && has('teams') && (
                <>
                  <form
                    className={panel}
                    aria-labelledby='assign-heading'
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = event.currentTarget;
                      const values = new FormData(form);
                      void run(async () => {
                        await act('/assignments', {
                          courseId: values.get('courseId'),
                          userIds: values.getAll('userIds'),
                          teamId: values.get('teamId') || undefined,
                          dueAt: values.get('dueAt')
                            ? new Date(String(values.get('dueAt'))).toISOString()
                            : undefined,
                        });
                        form.reset();
                      });
                    }}
                  >
                    <div className='space-y-1'>
                      <h2 id='assign-heading' className='text-lg font-semibold'>
                        Assign training
                      </h2>
                      <p className='text-sm text-muted-foreground'>
                        Assigns current team members. Existing active assignments are preserved.
                      </p>
                    </div>
                    <div className='grid gap-4 md:grid-cols-3'>
                      <SelectField
                        label='Course'
                        name='courseId'
                        required
                        requiredMessage='Choose a course to assign.'
                        placeholder='Choose course'
                        emptyMessage='Create a course first'
                        options={data.courses.map((course) => ({ value: course.id, label: course.title }))}
                      />
                      <SelectField
                        label={
                          <>
                            Team <span className='font-normal text-muted-foreground'>(optional)</span>
                          </>
                        }
                        name='teamId'
                        options={[
                          { value: '', label: 'Individual employees only' },
                          ...assignableTeams.map((team) => ({ value: team.id, label: team.name })),
                        ]}
                      />
                      <label className={fieldLabel}>
                        Deadline <span className='font-normal text-muted-foreground'>(your device timezone)</span>
                        <input className={control} name='dueAt' type='datetime-local' />
                      </label>
                    </div>
                    <fieldset className='space-y-3'>
                      <legend className='text-sm font-medium'>
                        Employees{' '}
                        <span className='font-normal text-muted-foreground'>(optional when a team is selected)</span>
                      </legend>
                      <div className='flex flex-wrap gap-x-5 gap-y-2'>
                        {data.members
                          .filter((member) => member.active)
                          .map((member) => (
                            <label key={member.id} className='flex items-center gap-2 text-sm'>
                              <input className={check} type='checkbox' name='userIds' value={member.userId} />
                              {member.user.username}
                            </label>
                          ))}
                      </div>
                    </fieldset>
                    <Button disabled={busy || !data.courses.length}>
                      {busy ? <Spinner /> : <ClipboardList aria-hidden='true' />}
                      Assign training
                    </Button>
                  </form>

                  <section className={panel} aria-labelledby='assignments-heading'>
                    <h2 id='assignments-heading' className='text-lg font-semibold'>
                      Training assignments
                    </h2>
                    {data.assignments.length === 0 ? (
                      <EmptyState
                        size='sm'
                        icon={ClipboardList}
                        title='No assignments yet'
                        description='Use the form above to assign a course to employees or a whole team.'
                      />
                    ) : (
                      <ul className='divide-y'>
                        {data.assignments.map((assignment) => {
                          const learner =
                            data.members.find((member) => member.userId === assignment.userId)?.user.username ||
                            'Member';
                          const cycle = assignment.cycles[0];
                          return (
                            <li
                              className='flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0'
                              key={assignment.id}
                            >
                              <div className='space-y-1'>
                                <p className='font-medium'>
                                  {assignment.course.title}{' '}
                                  <span className='font-normal text-muted-foreground'>· {learner}</span>
                                </p>
                                <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
                                  {assignment.cancelledAt ? (
                                    <Badge variant='secondary'>Cancelled</Badge>
                                  ) : cycle?.completedAt ? (
                                    <Badge variant='success'>Completed · renewals active</Badge>
                                  ) : (
                                    <Badge variant='info'>Active</Badge>
                                  )}
                                  <span>Due {displayDate(cycle?.dueAt || null, org.timezone)}</span>
                                </div>
                              </div>
                              {!assignment.cancelledAt && (
                                <ConfirmAction
                                  trigger='Cancel'
                                  triggerLabel={`Cancel ${assignment.course.title} assignment for ${learner}`}
                                  title='Cancel this assignment?'
                                  description={`${learner} will no longer be required to complete ${assignment.course.title}, and future renewals stop.`}
                                  confirmLabel='Cancel assignment'
                                  disabled={busy}
                                  onConfirm={() => run(() => act(`/assignments/${assignment.id}/cancel`, {}))}
                                />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                </>
              )}
            </div>
          )}

          {activeTab === 'people' && (
            <PeoplePanel
              members={data.members}
              teams={data.teams}
              departments={data.departments}
              admin={admin}
              teamsEnabled={has('teams')}
              act={act}
            />
          )}

          {activeTab === 'certificates' &&
            (data.certificates.length === 0 ? (
              <EmptyState
                icon={Award}
                title='No certificates yet'
                description="Complete a course's certification requirements and your certificate will appear here."
                action={
                  <Button variant='outline' onClick={() => selectTab('training')}>
                    Go to my training
                  </Button>
                }
              />
            ) : (
              <ul className='grid gap-4 md:grid-cols-2'>
                {data.certificates.map((certificate) => {
                  const expired = certificate.expiresAt ? new Date(certificate.expiresAt) < new Date() : false;
                  return (
                    <li key={certificate.id}>
                      <article className={`${panel} flex h-full flex-col`}>
                        <div className='flex items-start justify-between gap-3'>
                          <span className='flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground'>
                            <Award aria-hidden='true' className='size-5' />
                          </span>
                          {certificate.legacy ? (
                            <Badge variant='secondary'>Legacy</Badge>
                          ) : !certificate.expiresAt ? (
                            <Badge variant='success'>No expiry</Badge>
                          ) : expired ? (
                            <Badge variant='destructive'>Expired</Badge>
                          ) : (
                            <Badge variant='success'>Valid</Badge>
                          )}
                        </div>
                        <div className='space-y-1'>
                          <h2 className='text-lg font-semibold'>{certificate.courseTitle}</h2>
                          <p className='text-sm text-muted-foreground'>{certificate.user?.username}</p>
                        </div>
                        <dl className='space-y-1 text-sm'>
                          <div>
                            <dt className='sr-only'>Issued</dt>
                            <dd>
                              {certificate.legacy
                                ? 'Legacy completion · historical issue date unavailable'
                                : `Issued ${displayDate(certificate.issuedAt, org.timezone)}`}
                            </dd>
                          </div>
                          <div>
                            <dt className='sr-only'>Validity</dt>
                            <dd className='text-muted-foreground'>
                              {certificate.legacy
                                ? 'Preserved academic completion record'
                                : certificate.expiresAt
                                  ? `${expired ? 'Expired' : 'Valid until'} ${displayDate(certificate.expiresAt, org.timezone)}`
                                  : 'No expiry'}
                            </dd>
                          </div>
                          <div>
                            <dt className='sr-only'>Credential ID</dt>
                            <dd className='break-all font-mono text-xs text-muted-foreground'>
                              Credential ID: {certificate.id}
                            </dd>
                          </div>
                        </dl>
                        <Button variant='outline' asChild className='mt-auto w-fit'>
                          <Link
                            href={`/organizations/${id}/certificates/${certificate.id}`}
                            aria-label={`View certificate for ${certificate.courseTitle}`}
                          >
                            View certificate
                          </Link>
                        </Button>
                      </article>
                    </li>
                  );
                })}
              </ul>
            ))}

          {activeTab === 'reports' && (
            <section className={panel} aria-labelledby='report-heading'>
              <div className='flex flex-wrap items-center justify-between gap-4'>
                <h2 id='report-heading' className='text-lg font-semibold'>
                  Employee progress
                </h2>
                <Button disabled={busy} variant='outline' onClick={() => void run(exportCsv)}>
                  {busy ? <Spinner /> : <Download aria-hidden='true' />}
                  Export CSV
                </Button>
              </div>

              <fieldset>
                <legend className='sr-only'>Filter report</legend>
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
                  {[
                    { key: 'userId', label: 'Employee', values: data.members.map((m) => ({ id: m.userId, name: m.user.username })) },
                    { key: 'departmentId', label: 'Department', values: data.departments },
                    { key: 'teamId', label: 'Team', values: data.teams },
                    { key: 'courseId', label: 'Course', values: data.courses.map((c) => ({ id: c.id, name: c.title })) },
                    {
                      key: 'status',
                      label: 'Status',
                      values: [
                        { id: 'in-progress', name: 'In progress' },
                        { id: 'completed', name: 'Completed' },
                        { id: 'overdue', name: 'Overdue' },
                        { id: 'cancelled', name: 'Cancelled' },
                      ],
                    },
                  ].map((filter) => (
                    <SelectField
                      key={filter.key}
                      label={filter.label}
                      value={filters[filter.key] || ''}
                      onValueChange={(value) => setFilters({ ...filters, [filter.key]: value })}
                      options={[
                        { value: '', label: 'All' },
                        ...filter.values.map((value) => ({ value: value.id, label: value.name })),
                      ]}
                    />
                  ))}
                </div>
              </fieldset>

              {report ? (
                <>
                  <dl className='grid grid-cols-2 gap-3 md:grid-cols-4'>
                    {Object.entries(report.summary).map(([key, value]) => (
                      <div key={key} className='rounded-lg border bg-muted/40 p-4'>
                        <dt className='text-sm capitalize text-muted-foreground'>{key}</dt>
                        <dd className='mt-1 text-2xl font-semibold tabular-nums'>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {report.rows.length === 0 ? (
                    <EmptyState
                      size='sm'
                      icon={BarChart3}
                      title='No training matches these filters'
                      description='Try clearing a filter to widen the results.'
                      action={
                        query ? (
                          <Button variant='outline' size='sm' onClick={() => setFilters({})}>
                            Clear filters
                          </Button>
                        ) : undefined
                      }
                    />
                  ) : (
                    <div className='-mx-5 overflow-x-auto sm:-mx-6'>
                      <table className='w-full text-left text-sm'>
                        <caption className='sr-only'>Employee training progress ({report.rows.length} rows)</caption>
                        <thead className='border-y bg-muted/40 text-muted-foreground'>
                          <tr>
                            {['Employee', 'Course / cycle', 'Progress', 'Quiz', 'Status', 'Certification', 'Deadline'].map(
                              (label) => (
                                <th key={label} scope='col' className='whitespace-nowrap px-4 py-2.5 font-medium first:pl-5 sm:first:pl-6'>
                                  {label}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody className='divide-y'>
                          {report.rows.map((row) => (
                            <tr key={row.assignmentId} className='align-top'>
                              <td className='px-4 py-3 pl-5 sm:pl-6'>
                                <p className='font-medium'>{row.employee}</p>
                                <p className='text-muted-foreground'>{row.department}</p>
                              </td>
                              <td className='px-4 py-3'>
                                <p>{row.course}</p>
                                <p className='text-muted-foreground'>Cycle {row.cycle}</p>
                              </td>
                              <td className='px-4 py-3 tabular-nums'>{row.progress}%</td>
                              <td className='px-4 py-3 tabular-nums'>
                                {row.quizScore === null ? '—' : `${Math.round(row.quizScore)}%`}
                              </td>
                              <td className='px-4 py-3'>
                                <Badge variant={reportStatusVariant[row.status] ?? 'secondary'} className='capitalize'>
                                  {row.status}
                                </Badge>
                              </td>
                              <td className='px-4 py-3'>
                                <p>{row.certification}</p>
                                <p className='text-muted-foreground'>{displayDate(row.expiresAt, org.timezone)}</p>
                              </td>
                              <td className='whitespace-nowrap px-4 py-3'>{displayDate(row.dueAt, org.timezone)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <LoadingRegion label='Loading report' className='space-y-4'>
                  <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className='h-20' />
                    ))}
                  </div>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-10 w-full' />
                  ))}
                </LoadingRegion>
              )}
            </section>
          )}

          {activeTab === 'inbox' &&
            (data.notices.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title='No reminders yet'
                description='Deadline reminders and renewal notices for your training will show up here.'
              />
            ) : (
              <ul className='space-y-3'>
                {data.notices.map((notice) => (
                  <li key={notice.id}>
                    <article className={`${panel} ${notice.readAt ? '' : 'border-l-4 border-l-primary'}`}>
                      <div className='flex flex-wrap items-start justify-between gap-3'>
                        <h2 className='flex items-center gap-2 font-semibold'>
                          {!notice.readAt && <Badge variant='info'>New</Badge>}
                          {notice.subject}
                        </h2>
                        <time dateTime={notice.createdAt} className='text-xs text-muted-foreground'>
                          {displayDate(notice.createdAt, org.timezone)}
                        </time>
                      </div>
                      <p className='whitespace-pre-wrap break-words text-sm leading-6'>{notice.message}</p>
                      {!notice.readAt && (
                        <Button
                          size='sm'
                          variant='outline'
                          disabled={busy}
                          onClick={() => void run(() => act(`/notifications/${notice.id}/read`, {}))}
                          aria-label={`Mark “${notice.subject}” as read`}
                        >
                          Mark as read
                        </Button>
                      )}
                    </article>
                  </li>
                ))}
              </ul>
            ))}

          {activeTab === 'settings' && (
            <SettingsPanel
              key={`${org.mode}-${org.modules.join(',')}`}
              organization={org}
              deliveries={data.deliveries}
              act={act}
            />
          )}

          {activeTab === 'coach' && (
            <section className={panel} aria-labelledby='coach-heading'>
              <div className='flex items-start gap-3'>
                <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground'>
                  <Sparkles aria-hidden='true' className='size-5' />
                </span>
                <div className='space-y-1'>
                  <h2 id='coach-heading' className='text-lg font-semibold'>
                    Your study coach
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Ask for a study plan, a concept explanation, or help prioritizing your training.
                  </p>
                </div>
              </div>
              <form
                className='space-y-3'
                onSubmit={(event) => {
                  event.preventDefault();
                  const values = new FormData(event.currentTarget);
                  void run(async () => {
                    const result = await api<{ content: string }>('/ai/study-coach', 'POST', {
                      prompt: values.get('prompt'),
                    });
                    setCoach(result.content);
                  });
                }}
              >
                <label className={fieldLabel}>
                  What would you like to work on?
                  <textarea
                    name='prompt'
                    className={control}
                    rows={4}
                    required
                    maxLength={1200}
                    placeholder='Help me plan this week’s training.'
                  />
                </label>
                <Button disabled={busy}>
                  {busy ? <Spinner /> : <Brain aria-hidden='true' />}
                  {busy ? 'Thinking…' : 'Ask the coach'}
                </Button>
              </form>
              <div aria-live='polite'>
                {coach && (
                  <div className='rounded-lg border bg-muted/40 p-4'>
                    <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                      Coach response
                    </p>
                    <p className='whitespace-pre-wrap text-sm leading-6'>{coach}</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
