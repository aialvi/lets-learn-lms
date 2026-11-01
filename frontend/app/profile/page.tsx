'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingRegion, Skeleton } from '@/components/ui/skeleton';
import {
  Mail,
  BookOpen,
  Edit3,
  Save,
  X,
  Trophy,
  Calendar,
  CheckCircle,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { fetchEnrollments, getCourseVideosProgress } from '@/lib/api';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  lessons: {
    id: string;
    title: string;
    order: number;
  }[];
}

interface Enrollment {
  id: string;
  status: string;
  progress: number;
  course: Course;
  createdAt: string;
}

interface VideoProgress {
  lessonId: string;
  completed: boolean;
  watchTime: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [videoProgress, setVideoProgress] = useState<
    Record<string, VideoProgress[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      setEditData({
        name: session.user.name || '',
        email: session.user.email || '',
      });
    }
  }, [session]);

  const loadEnrollments = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchEnrollments(session.accessToken);
      setEnrollments(data);

      // Fetch video progress for each enrolled course
      const progressData: Record<string, VideoProgress[]> = {};
      for (const enrollment of data) {
        try {
          const progress = await getCourseVideosProgress(
            enrollment.course.id,
            session.accessToken
          );

          // Handle different response formats
          if (Array.isArray(progress)) {
            progressData[enrollment.course.id] = progress;
          } else if (progress && typeof progress === 'object') {
            progressData[enrollment.course.id] = progress.data || progress.progress || [];
          } else {
            progressData[enrollment.course.id] = [];
          }
        } catch (error) {
          console.error(`Error fetching progress for course ${enrollment.course.id}:`, error);
          progressData[enrollment.course.id] = [];
        }
      }
      setVideoProgress(progressData);
    } catch (error) {
      console.error('Error loading enrollments:', error);
      setLoadError('We couldn’t load your courses. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (status === 'authenticated') loadEnrollments();
  }, [status, loadEnrollments]);

  const handleSave = async () => {
    // Profile updates aren't persisted by the API yet; be explicit with the user.
    toast.info('Profile editing isn’t available yet', {
      description: 'Your name and email can’t be changed from here right now.',
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: session?.user?.name || '',
      email: session?.user?.email || '',
    });
    setIsEditing(false);
  };

  if (status === 'loading' || !session) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MainNav />
        <main id="main-content" className="flex-1">
          <LoadingRegion label="Loading your profile" className="container-page max-w-4xl space-y-8 py-10 sm:py-12">
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full sm:size-20" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 max-w-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          </LoadingRegion>
        </main>
        <Footer />
      </div>
    );
  }

  const completedCourses = (enrollments || []).filter(e => e.progress >= 100).length;
  const totalLessons = (enrollments || []).reduce((acc, e) => acc + (e.course.lessons?.length || 0), 0);
  const completedLessons = (enrollments || []).reduce((acc, e) => {
    const courseProgress = videoProgress[e.course.id] || [];
    if (!Array.isArray(courseProgress)) return acc;
    const completed = courseProgress.filter(p => p.completed).length;
    return acc + completed;
  }, 0);
  const memberSince = new Date(session.user.email ? '2024-01-01' : Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const initials = (session.user.name || session.user.email || 'U')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const coursesEmpty = (
    <EmptyState
      size="sm"
      icon={BookOpen}
      title="No courses yet"
      description="Enroll in a course and your progress will be tracked here."
      action={
        <Button asChild size="sm">
          <Link href="/courses">Browse courses</Link>
        </Button>
      }
    />
  );

  const listSkeleton = (
    <LoadingRegion label="Loading your courses" className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </LoadingRegion>
  );

  const loadErrorState = loadError ? (
    <ErrorState title="Couldn’t load your courses" message={loadError} onRetry={loadEnrollments} />
  ) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main id="main-content" className="flex-1">
        <div className="container-page max-w-4xl py-10 sm:py-12">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <span
              aria-hidden="true"
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-semibold text-accent-foreground sm:size-20 sm:text-2xl"
            >
              {initials}
            </span>
            <div className="min-w-0 space-y-2">
              <h1 className="page-title truncate">{session.user.name || 'Your profile'}</h1>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{session.user.email}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <Calendar aria-hidden="true" />
                  Member since {memberSince}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  <ShieldCheck aria-hidden="true" />
                  {session.user.role}
                </Badge>
              </div>
            </div>
          </header>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:w-fit">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">My courses</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <h2 className="sr-only">Overview</h2>
              {loading ? (
                <LoadingRegion label="Loading your stats" className="grid gap-4 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-28" />
                  ))}
                </LoadingRegion>
              ) : loadErrorState ? (
                loadErrorState
              ) : (
                <>
                  <dl className="grid gap-4 sm:grid-cols-3">
                    <ProfileStat icon={BookOpen} label="Enrolled courses" value={(enrollments || []).length} hint="Active learning paths" />
                    <ProfileStat icon={Trophy} label="Completed courses" value={completedCourses} hint="Certificates earned" />
                    <ProfileStat icon={CheckCircle} label="Completed lessons" value={completedLessons} hint={`Out of ${totalLessons} total`} />
                  </dl>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(enrollments || []).length > 0 ? (
                        <ul className="divide-y">
                          {(enrollments || []).slice(0, 3).map((enrollment) => (
                            <li key={enrollment.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                                  <BookOpen aria-hidden="true" className="size-5" />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{enrollment.course.title}</p>
                                  <p className="truncate text-sm text-muted-foreground">
                                    by {enrollment.course.author.firstName} {enrollment.course.author.lastName}
                                  </p>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-medium tabular-nums">{enrollment.progress}% complete</p>
                                <p className="text-xs text-muted-foreground">
                                  {enrollment.course.lessons?.length || 0} lessons
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        coursesEmpty
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="courses" className="space-y-6">
              <h2 className="sr-only">My courses</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Enrolled courses</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    listSkeleton
                  ) : loadErrorState ? (
                    loadErrorState
                  ) : (enrollments || []).length > 0 ? (
                    <ul className="space-y-4">
                      {(enrollments || []).map((enrollment) => {
                        const done = enrollment.progress >= 100;
                        return (
                          <li key={enrollment.id} className="rounded-lg border p-4">
                            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <h4 className="text-base font-semibold">{enrollment.course.title}</h4>
                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{enrollment.course.description}</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  by {enrollment.course.author.firstName} {enrollment.course.author.lastName}
                                </p>
                              </div>
                              <Badge variant={done ? 'success' : 'secondary'}>
                                {done ? <CheckCircle aria-hidden="true" /> : null}
                                {done ? 'Completed' : 'In progress'}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span id={`progress-${enrollment.id}`}>Progress</span>
                                <span className="tabular-nums">{enrollment.progress}%</span>
                              </div>
                              <Progress
                                value={enrollment.progress}
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={enrollment.progress}
                                aria-labelledby={`progress-${enrollment.id}`}
                              />
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  {enrollment.course.lessons?.length || 0} lessons
                                </span>
                                <Button asChild size="sm" variant={done ? 'outline' : 'default'}>
                                  <Link href={`/courses/${enrollment.course.id}`}>
                                    {done ? 'Review' : 'Continue'}
                                    <span className="sr-only"> {enrollment.course.title}</span>
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    coursesEmpty
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <h2 className="sr-only">Settings</h2>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                  <CardTitle>Account information</CardTitle>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit3 aria-hidden="true" />
                      Edit
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <form
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleSave();
                    }}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        {isEditing ? <Label htmlFor="name">Name</Label> : <p className="text-sm font-medium">Name</p>}
                        {isEditing ? (
                          <Input
                            id="name"
                            autoComplete="name"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          />
                        ) : (
                          <p className="rounded-md bg-muted px-3 py-2 text-sm">{session.user.name || '—'}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        {isEditing ? <Label htmlFor="email">Email</Label> : <p className="text-sm font-medium">Email</p>}
                        {isEditing ? (
                          <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={editData.email}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          />
                        ) : (
                          <p className="break-all rounded-md bg-muted px-3 py-2 text-sm">{session.user.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Role</p>
                      <p className="rounded-md bg-muted px-3 py-2 text-sm capitalize">{session.user.role}</p>
                    </div>

                    {isEditing && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button type="submit" size="sm">
                          <Save aria-hidden="true" />
                          Save changes
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancel} size="sm">
                          <X aria-hidden="true" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PreferenceRow title="Email notifications" description="Receive email updates about your courses." />
                  <Separator />
                  <PreferenceRow title="Privacy settings" description="Manage your data and privacy preferences." />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ProfileStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint: string;
}) {
  return (
    <div className="surface flex flex-col gap-3 p-5">
      <dt className="flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
        {label}
        <Icon aria-hidden="true" className="size-4" />
      </dt>
      <dd className="space-y-1">
        <span className="block text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </dd>
    </div>
  );
}

function PreferenceRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge variant="outline" className="text-muted-foreground">Coming soon</Badge>
    </div>
  );
}
