'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingRegion, Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Brain,
  Clock,
  Flame,
  MessageSquareText,
  Route,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  Play,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import {
  fetchEnrollments,
  getCourseVideosProgress,
  requestStudyCoach,
} from '@/lib/api';
import { coachPrompts, microChallenges, skillTracks } from '@/lib/growth-features';
import { CourseCover } from '@/components/courses/course-cover';

interface Course {
  imageUrl?: string | null;
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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [videoProgress, setVideoProgress] = useState<
    Record<string, VideoProgress[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coachLoadingPrompt, setCoachLoadingPrompt] = useState<string | null>(null);
  const [coachResponse, setCoachResponse] = useState<string | null>(null);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [lastCoachPrompt, setLastCoachPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  const fetchDashboardData = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch enrollments
      const enrollmentsData = await fetchEnrollments(session.accessToken);
      setEnrollments(enrollmentsData);

      // Fetch video progress for each enrolled course
      const progressData: Record<string, VideoProgress[]> = {};
      for (const enrollment of enrollmentsData) {
        try {
          const progress = await getCourseVideosProgress(
            enrollment.course.id,
            session.accessToken
          );

          // Handle different response formats
          if (Array.isArray(progress)) {
            progressData[enrollment.course.id] = progress;
          } else if (progress && typeof progress === 'object') {
            // If it's an object, try to extract the array
            progressData[enrollment.course.id] =
              progress.lessons?.map((lesson: { id: string; completed: boolean; watchTime: number }) => ({ lessonId: lesson.id, completed: lesson.completed, watchTime: lesson.watchTime })) || progress.data || progress.progress || [];
          } else {
            progressData[enrollment.course.id] = [];
          }
        } catch (error) {
          console.error(
            `Error fetching progress for course ${enrollment.course.id}:`,
            error
          );
          progressData[enrollment.course.id] = [];
        }
      }
      setVideoProgress(progressData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('We couldn’t load your courses and progress. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    const fetchData = async () => {
      if (session?.accessToken) {
        await fetchDashboardData();
      }
    };

    fetchData();
  }, [session?.accessToken, fetchDashboardData]);

  const calculateCourseProgress = (courseId: string, totalLessons: number) => {
    const progress = videoProgress[courseId] || [];
    if (totalLessons === 0) return 0;
    if (!Array.isArray(progress)) return 0;
    const completedLessons = progress.filter((p) => p.completed).length;
    return Math.round((completedLessons / totalLessons) * 100);
  };

  const getRecentActivity = () => {
    return enrollments
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 3);
  };

  const getTotalWatchTime = () => {
    let totalSeconds = 0;
    Object.values(videoProgress).forEach((courseProgress) => {
      if (Array.isArray(courseProgress)) {
        courseProgress.forEach((progress) => {
          totalSeconds += progress.watchTime || 0;
        });
      }
    });
    return Math.round(totalSeconds / 60); // Convert to minutes
  };

  const getCompletedLessons = () => {
    let completed = 0;
    Object.values(videoProgress).forEach((courseProgress) => {
      if (Array.isArray(courseProgress)) {
        courseProgress.forEach((progress) => {
          if (progress.completed) completed++;
        });
      }
    });
    return completed;
  };

  const getAverageProgress = () => {
    if (enrollments.length === 0) return 0;
    const total = enrollments.reduce((sum, enrollment) => {
      return sum + calculateCourseProgress(enrollment.course.id, enrollment.course.lessons?.length || 0);
    }, 0);
    return Math.round(total / enrollments.length);
  };

  const getLearningStreak = () => {
    const activeDays = new Set(
      enrollments.map((enrollment) =>
        new Date(enrollment.createdAt).toLocaleDateString()
      )
    );
    return Math.max(1, Math.min(7, activeDays.size || getCompletedLessons()));
  };

  const getLearnerHealth = () => {
    const averageProgress = getAverageProgress();
    const completedLessons = getCompletedLessons();
    if (averageProgress >= 70 || completedLessons >= 5) {
      return {
        label: 'On track',
        detail: 'Keep the current cadence and add one proof-of-work artifact.',
      };
    }
    if (enrollments.length > 0 && completedLessons === 0) {
      return {
        label: 'Needs first win',
        detail: 'Start with a 10-minute lesson and complete one recall drill today.',
      };
    }
    return {
      label: 'Building momentum',
      detail: 'Use microlearning drills to turn course starts into weekly progress.',
    };
  };

  const getRecommendedTrack = () => {
    const titles = enrollments.map((enrollment) => enrollment.course.title.toLowerCase()).join(' ');
    if (titles.includes('design') || titles.includes('marketing')) return skillTracks[2];
    if (titles.includes('business') || titles.includes('product')) return skillTracks[1];
    return skillTracks[0];
  };

  const learnerHealth = getLearnerHealth();
  const recommendedTrack = getRecommendedTrack();

  const handleCoachPrompt = async (prompt: string) => {
    if (!session?.accessToken) return;

    try {
      setCoachLoadingPrompt(prompt);
      setLastCoachPrompt(prompt);
      setCoachError(null);
      const response = await requestStudyCoach(
        {
          prompt,
          intent: 'learner-dashboard-coaching',
          recentCourseIds: enrollments.map((enrollment) => enrollment.course.id).slice(0, 3),
        },
        session.accessToken
      );
      setCoachResponse(response.content);
    } catch (error) {
      console.error('AI coach request failed:', error);
      setCoachError(
        'The AI coach didn’t respond. It may be temporarily unavailable — try again in a moment.'
      );
    } finally {
      setCoachLoadingPrompt(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className='flex min-h-screen flex-col bg-background'>
        <MainNav />
        <main id='main-content' className='flex-1'>
          <LoadingRegion label='Loading your dashboard' className='container-page space-y-8 py-10 sm:py-12'>
            <div className='grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end'>
              <div className='space-y-3'>
                <Skeleton className='h-3 w-28' />
                <Skeleton className='h-9 w-80 max-w-full' />
                <Skeleton className='h-4 w-[30rem] max-w-full' />
              </div>
              <Skeleton className='h-28 w-full lg:w-80' />
            </div>
            <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-28' />
              ))}
            </div>
            <Skeleton className='h-10 w-full' />
            <div className='grid gap-6 md:grid-cols-2'>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className='surface overflow-hidden'>
                  <Skeleton className='aspect-[16/6] w-full rounded-none' />
                  <div className='space-y-3 p-6'>
                    <Skeleton className='h-5 w-2/3' />
                    <Skeleton className='h-4 w-1/3' />
                    <Skeleton className='h-2 w-full' />
                    <Skeleton className='h-9 w-full' />
                  </div>
                </div>
              ))}
            </div>
          </LoadingRegion>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-screen flex-col bg-background'>
        <MainNav />
        <main id='main-content' className='container-page flex-1 py-10 sm:py-12'>
          <h1 className='page-title mb-6'>Dashboard</h1>
          <ErrorState
            title='Your dashboard didn’t load'
            message={error}
            onRetry={fetchDashboardData}
            action={
              <Button asChild variant='ghost'>
                <Link href='/courses'>Browse courses</Link>
              </Button>
            }
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className='flex flex-col min-h-screen bg-background'>
      <MainNav />
      <main id='main-content' className='flex-1 w-full'>
        <div className='container-page py-10 sm:py-12'>
          <div className='mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end'>
            <div>
              <p className="eyebrow">Learner cockpit</p>
              <h1 className='page-title mt-2 mb-2'>
                Welcome back, {session?.user?.name || 'Student'}.
              </h1>
              <p className='page-description'>
                Your AI-ready dashboard for skills, momentum, and measurable learning outcomes.
              </p>
            </div>
            <div className="surface p-5 lg:max-w-sm">
              <p className="eyebrow">Learner health</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{learnerHealth.label}</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                {learnerHealth.detail}
              </p>
            </div>
          </div>

          <section aria-labelledby='stats-heading' className='mb-8'>
            <h2 id='stats-heading' className='sr-only'>Learning summary</h2>
            <dl className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
              <StatCard icon={BookOpen} label='Enrolled courses' value={enrollments.length} hint='Active learning paths' />
              <StatCard icon={Clock} label='Watch time' value={`${getTotalWatchTime()} min`} hint='Total minutes watched' />
              <StatCard icon={Trophy} label='Completed lessons' value={getCompletedLessons()} hint='Lessons finished' />
              <StatCard icon={Target} label='Skill readiness' value={`${getAverageProgress()}%`} hint='Average path progress' />
            </dl>
          </section>

          <Tabs defaultValue='courses' className='space-y-6'>
            <TabsList className='flex h-auto w-full justify-start overflow-x-auto md:grid md:grid-cols-5'>
              <TabsTrigger value='courses'>My courses</TabsTrigger>
              <TabsTrigger value='skills'>Skill plan</TabsTrigger>
              <TabsTrigger value='coach'>AI Coach</TabsTrigger>
              <TabsTrigger value='drills'>Drills</TabsTrigger>
              <TabsTrigger value='activity'>Recent activity</TabsTrigger>
            </TabsList>

            <TabsContent value='courses' className='space-y-6'>
              <h2 className='sr-only'>My courses</h2>
              {enrollments.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title='You haven’t enrolled in a course yet'
                  description='Browse the catalog and enroll in a course — your progress, next lessons and stats will show up here.'
                  action={
                    <Button asChild>
                      <Link href='/courses'>Browse courses</Link>
                    </Button>
                  }
                />
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {enrollments.map((enrollment) => {
                    const lessons = enrollment.course.lessons || [];
                    const progress = calculateCourseProgress(
                      enrollment.course.id,
                      lessons.length
                    );
                    const courseProgress =
                      videoProgress[enrollment.course.id] || [];
                    const nextLesson = lessons.find(
                      (lesson) =>
                        !Array.isArray(courseProgress) ||
                        !courseProgress.some(
                          (p) => p.lessonId === lesson.id && p.completed
                        )
                    );

                    return (
                      <Card
                        key={enrollment.id}
                        className='overflow-hidden transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-sm'
                      >
                        <CourseCover src={enrollment.course.imageUrl} title={enrollment.course.title} className="aspect-[16/6]" />
                        <CardHeader>
                          <div className='flex items-start justify-between gap-3'>
                            <div className='min-w-0 flex-1'>
                              <CardTitle className='mb-2'>
                                {enrollment.course.title}
                              </CardTitle>
                              <p className='text-sm text-muted-foreground mb-2'>
                                by {enrollment.course.author.firstName}{' '}
                                {enrollment.course.author.lastName}
                              </p>
                              <Badge variant='outline' className='mb-3'>
                                {lessons.length} lessons
                              </Badge>
                            </div>
                            <Badge
                              variant={
                                progress === 100 ? 'success' : 'secondary'
                              }
                            >
                              {progress === 100 ? <CheckCircle aria-hidden='true' /> : null}
                              {progress}% complete
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className='space-y-4'>
                            <div>
                              <Progress
                                value={progress}
                                className='h-2'
                                role='progressbar'
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={progress}
                                aria-label={`${enrollment.course.title} progress`}
                              />
                              <p className='text-xs text-muted-foreground mt-1'>
                                {Array.isArray(courseProgress)
                                  ? courseProgress.filter((p) => p.completed)
                                      .length
                                  : 0}{' '}
                                of {lessons.length} lessons completed
                              </p>
                            </div>

                            {nextLesson && (
                              <div className='rounded-lg bg-accent p-3'>
                                <p className='mb-1 text-xs font-medium uppercase tracking-wide text-accent-foreground/80'>
                                  Next lesson
                                </p>
                                <p className='text-sm text-accent-foreground'>
                                  {nextLesson.title}
                                </p>
                              </div>
                            )}

                            <div className='flex gap-2'>
                              <Button size='sm' asChild className='flex-1'>
                                <Link href={`/courses/${enrollment.course.id}`}>
                                  {progress === 0 ? (
                                    <>
                                      <Play aria-hidden='true' />
                                      Start course
                                    </>
                                  ) : (
                                    <>
                                      <TrendingUp aria-hidden='true' />
                                      Continue
                                    </>
                                  )}
                                </Link>
                              </Button>
                              {progress === 100 && (
                                <Button variant='outline' size='sm' asChild>
                                  <Link href={`/courses/${enrollment.course.id}`}>
                                    <CheckCircle aria-hidden='true' />
                                    Review
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value='skills' className='space-y-6'>
              <h2 className='sr-only'>Skill plan</h2>
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <Route aria-hidden="true" className="size-5" />
                      </span>
                      <div>
                        <CardTitle>{recommendedTrack.name}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">{recommendedTrack.fit}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">Readiness score</span>
                        <span className="text-muted-foreground">{getAverageProgress()}%</span>
                      </div>
                      <Progress
                        value={getAverageProgress()}
                        className="h-2"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={getAverageProgress()}
                        aria-label="Readiness score"
                      />
                    </div>
                    <div className="rounded-md border bg-background p-4">
                      <p className="text-sm font-semibold text-foreground">Next best action</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {recommendedTrack.nextAction}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Skill map</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {recommendedTrack.skills.map((skill, index) => (
                        <div key={skill} className="rounded-md border bg-background p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="flex size-8 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                              {index + 1}
                            </span>
                            <Badge variant={index === 0 ? 'default' : 'outline'}>
                              {index === 0 ? 'Focus' : 'Next'}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-foreground">{skill}</p>
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            Connect this skill to a course outcome and proof artifact.
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='coach' className='space-y-6'>
              <h2 className='sr-only'>AI coach</h2>
              <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <Brain aria-hidden="true" className="size-5" />
                      </span>
                      <div>
                        <CardTitle>AI study coach</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Prompt templates for tutoring, reflection, and adaptive study planning.
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {coachPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          className="rounded-lg border bg-background p-4 text-left text-sm leading-6 text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={Boolean(coachLoadingPrompt)}
                          aria-busy={coachLoadingPrompt === prompt}
                          onClick={() => handleCoachPrompt(prompt)}
                          type="button"
                        >
                          {coachLoadingPrompt === prompt ? (
                            <Spinner className="mb-3 text-primary" />
                          ) : (
                            <Sparkles aria-hidden="true" className="mb-3 size-4 text-primary" />
                          )}
                          <span className="block">{prompt}</span>
                          {coachLoadingPrompt === prompt ? (
                            <span className="mt-1 block text-xs text-muted-foreground">Asking coach…</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommended intervention</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border bg-background p-4" aria-live="polite">
                      <p className="text-sm font-semibold text-foreground">Coach response</p>
                      {coachError ? (
                        <Alert variant="destructive" className="mt-3">
                          <AlertCircle aria-hidden="true" />
                          <AlertDescription>
                            <p>{coachError}</p>
                            {lastCoachPrompt ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                disabled={Boolean(coachLoadingPrompt)}
                                onClick={() => handleCoachPrompt(lastCoachPrompt)}
                              >
                                <RotateCcw aria-hidden="true" />
                                Try again
                              </Button>
                            ) : null}
                          </AlertDescription>
                        </Alert>
                      ) : coachLoadingPrompt ? (
                        <div className="mt-3 space-y-2" aria-hidden="true">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      ) : coachResponse ? (
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {coachResponse}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Choose a prompt to get personalized guidance based on the courses you’re taking.
                        </p>
                      )}
                    </div>
                    <div className="rounded-md border bg-background p-4">
                      <p className="text-sm font-semibold text-foreground">Today&apos;s coaching goal</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Generate a short quiz from your next lesson, then complete one microdrill.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='drills' className='space-y-6'>
              <h2 className='sr-only'>Drills</h2>
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <Flame aria-hidden="true" className="size-5" />
                      </span>
                      <div>
                        <CardTitle>{getLearningStreak()} day momentum</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Lightweight practice loop for retention.
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress
                      value={Math.min(100, getLearningStreak() * 14)}
                      className="h-2"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(100, getLearningStreak() * 14)}
                      aria-label="Weekly momentum"
                    />
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Complete one drill after each lesson to convert passive watching into active recall.
                    </p>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                  {microChallenges.map((challenge) => (
                    <Card key={challenge.title}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-md border bg-background text-primary">
                            <MessageSquareText aria-hidden="true" className="size-4" />
                          </span>
                          <CardTitle className="text-base">{challenge.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-6 text-muted-foreground">{challenge.prompt}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value='activity' className='space-y-6'>
              <h2 className='sr-only'>Recent activity</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Recently enrolled</CardTitle>
                </CardHeader>
                <CardContent>
                  {getRecentActivity().length === 0 ? (
                    <EmptyState
                      size='sm'
                      icon={Clock}
                      title='No activity yet'
                      description='Courses you enroll in will appear here so you can jump back in quickly.'
                      action={
                        <Button asChild size='sm' variant='outline'>
                          <Link href='/courses'>Find a course</Link>
                        </Button>
                      }
                    />
                  ) : (
                    <ul className='divide-y'>
                      {getRecentActivity().map((enrollment) => (
                        <li
                          key={enrollment.id}
                          className='flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0'
                        >
                          <div className='flex min-w-0 items-center gap-3'>
                            <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground'>
                              <BookOpen aria-hidden='true' className='size-4' />
                            </span>
                            <div className='min-w-0'>
                              <p className='truncate font-medium'>
                                {enrollment.course.title}
                              </p>
                              <p className='text-sm text-muted-foreground'>
                                Enrolled{' '}
                                {new Date(
                                  enrollment.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button variant='ghost' size='sm' asChild>
                            <Link href={`/courses/${enrollment.course.id}`}>
                              View<span className='sr-only'> {enrollment.course.title}</span>
                            </Link>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
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

function StatCard({
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
    <div className='surface flex flex-col gap-3 p-4 sm:p-5'>
      <dt className='flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground'>
        {label}
        <span className='flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground'>
          <Icon aria-hidden='true' className='size-4' />
        </span>
      </dt>
      <dd className='space-y-1'>
        <span className='block text-2xl font-semibold tracking-tight tabular-nums text-foreground'>{value}</span>
        <span className='block text-xs text-muted-foreground'>{hint}</span>
      </dd>
    </div>
  );
}
