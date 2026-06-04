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
  Clock,
  Trophy,
  TrendingUp,
  Play,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [videoProgress, setVideoProgress] = useState<
    Record<string, VideoProgress[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <div className='mb-8'>
            <h1 className='mb-2 text-3xl font-semibold tracking-tight text-foreground'>
              Welcome back, {session?.user?.name || 'Student'}!
            </h1>
            <p className='text-muted-foreground'>Continue your learning journey</p>
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
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
          </div>

          <Tabs defaultValue='courses' className='space-y-6'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='courses'>My Courses</TabsTrigger>
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
