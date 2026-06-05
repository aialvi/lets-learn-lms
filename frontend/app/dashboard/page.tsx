'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      console.log('Enrollments data:', enrollmentsData);
      setEnrollments(enrollmentsData);

      // Fetch video progress for each enrolled course
      const progressData: Record<string, VideoProgress[]> = {};
      for (const enrollment of enrollmentsData) {
        try {
          const progress = await getCourseVideosProgress(
            enrollment.course.id,
            session.accessToken
          );
          console.log(`Progress for course ${enrollment.course.id}:`, progress);

          // Handle different response formats
          if (Array.isArray(progress)) {
            progressData[enrollment.course.id] = progress;
          } else if (progress && typeof progress === 'object') {
            // If it's an object, try to extract the array
            progressData[enrollment.course.id] =
              progress.data || progress.progress || [];
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
      setError('Failed to load dashboard data. Please try again.');
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
        'AI coach is unavailable. Check OPENROUTER_API_KEY on the backend and try again.'
      );
    } finally {
      setCoachLoadingPrompt(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className='flex flex-col min-h-screen bg-background'>
        <MainNav />
        <main className='flex-1 flex items-center justify-center py-12'>
          <div className='container mx-auto px-4 py-8'>
            <div className='animate-pulse'>
              <div className='h-8 bg-muted rounded w-1/4 mb-6'></div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='h-32 bg-muted rounded-lg'></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col min-h-screen bg-background'>
        <MainNav />
        <main className='flex-1 flex items-center justify-center py-12'>
          <div className='container mx-auto px-4 py-8'>
            <Card>
              <CardContent className='pt-6'>
                <div className='text-center py-8'>
                  <p className='mb-4 text-destructive'>{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className='flex flex-col min-h-screen bg-background'>
      <MainNav />
      <main className='flex-1 w-full'>
        <div className='container-page py-12'>
          <div className='mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end'>
            <div>
              <p className="eyebrow">Learner cockpit</p>
              <h1 className='mt-2 mb-2 text-3xl font-semibold tracking-tight text-foreground'>
                Welcome back, {session?.user?.name || 'Student'}.
              </h1>
              <p className='text-muted-foreground'>
                Your AI-ready dashboard for skills, momentum, and measurable learning outcomes.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Learner health
              </p>
              <p className="mt-2 text-xl font-semibold text-foreground">{learnerHealth.label}</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                {learnerHealth.detail}
              </p>
            </div>
          </div>

          <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Enrolled Courses
                </CardTitle>
                <BookOpen className='h-4 w-4 text-primary' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{enrollments.length}</div>
                <p className='text-xs text-muted-foreground'>Active learning paths</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Watch Time
                </CardTitle>
                <Clock className='h-4 w-4 text-primary' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{getTotalWatchTime()}</div>
                <p className='text-xs text-muted-foreground'>Minutes watched</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Completed Lessons
                </CardTitle>
                <Trophy className='h-4 w-4 text-primary' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {getCompletedLessons()}
                </div>
                <p className='text-xs text-muted-foreground'>Lessons finished</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Skill Readiness
                </CardTitle>
                <Target className='h-4 w-4 text-primary' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{getAverageProgress()}%</div>
                <p className='text-xs text-muted-foreground'>Average path progress</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue='courses' className='space-y-6'>
            <TabsList className='grid w-full grid-cols-2 md:grid-cols-5'>
              <TabsTrigger value='courses'>My Courses</TabsTrigger>
              <TabsTrigger value='skills'>Skill Plan</TabsTrigger>
              <TabsTrigger value='coach'>AI Coach</TabsTrigger>
              <TabsTrigger value='drills'>Drills</TabsTrigger>
              <TabsTrigger value='activity'>Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value='courses' className='space-y-6'>
              {enrollments.length === 0 ? (
                <Card>
                  <CardContent className='pt-6'>
                    <div className='text-center py-8'>
                      <BookOpen className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
                      <h3 className='text-lg font-semibold text-foreground mb-2'>
                        No courses yet
                      </h3>
                      <p className='text-muted-foreground mb-4'>
                        Start learning by enrolling in a course
                      </p>
                      <Button asChild>
                        <Link href='/courses'>Browse Courses</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                        className='transition-colors hover:border-primary/45'
                      >
                        <CardHeader>
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <CardTitle className='text-lg mb-2'>
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
                                progress === 100 ? 'default' : 'secondary'
                              }
                            >
                              {progress}% Complete
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className='space-y-4'>
                            <div>
                              <Progress value={progress} className='h-2' />
                              <p className='text-xs text-muted-foreground mt-1'>
                                {Array.isArray(courseProgress)
                                  ? courseProgress.filter((p) => p.completed)
                                      .length
                                  : 0}{' '}
                                of {lessons.length} lessons completed
                              </p>
                            </div>

                            {nextLesson && (
                              <div className='bg-accent p-3 rounded-lg'>
                                <p className='text-sm font-medium text-accent-foreground mb-1'>
                                  Next lesson:
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
                                      <Play className='h-4 w-4 mr-2' />
                                      Start Course
                                    </>
                                  ) : (
                                    <>
                                      <TrendingUp className='h-4 w-4 mr-2' />
                                      Continue
                                    </>
                                  )}
                                </Link>
                              </Button>
                              {progress === 100 && (
                                <Button variant='outline' size='sm'>
                                  <CheckCircle className='h-4 w-4 mr-2' />
                                  Review
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
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <Route className="size-5" />
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
                      <Progress value={getAverageProgress()} className="h-2" />
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
              <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <Brain className="size-5" />
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
                          className="rounded-md border bg-background p-4 text-left text-sm leading-6 text-foreground transition-colors hover:border-primary/45"
                          disabled={Boolean(coachLoadingPrompt)}
                          onClick={() => handleCoachPrompt(prompt)}
                          type="button"
                        >
                          <Sparkles className="mb-3 size-4 text-primary" />
                          {coachLoadingPrompt === prompt ? 'Asking coach...' : prompt}
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
                    <div className="rounded-md border bg-background p-4">
                      <p className="text-sm font-semibold text-foreground">Coach response</p>
                      {coachError ? (
                        <p className="mt-2 text-sm leading-6 text-destructive">{coachError}</p>
                      ) : coachResponse ? (
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {coachResponse}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Choose a prompt to get personalized guidance from OpenRouter using your course context.
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
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <Flame className="size-5" />
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
                    <Progress value={Math.min(100, getLearningStreak() * 14)} className="h-2" />
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
                            <MessageSquareText className="size-4" />
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
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {getRecentActivity().length === 0 ? (
                    <div className='text-center py-8'>
                      <Clock className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
                      <p className='text-muted-foreground'>No recent activity</p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {getRecentActivity().map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className='flex items-center justify-between p-4 bg-muted rounded-lg'
                        >
                          <div className='flex items-center space-x-3'>
                            <div className='bg-accent p-2 rounded-full'>
                              <BookOpen className='h-4 w-4 text-primary' />
                            </div>
                            <div>
                              <p className='font-medium'>
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
                          <Button variant='ghost' size='sm' asChild className=' cursor-pointer'>
                            <Link href={`/courses/${enrollment.course.id}`}>
                              View Course
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
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
