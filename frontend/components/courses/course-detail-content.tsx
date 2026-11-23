'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  ListVideo,
  Lock,
  MonitorSmartphone,
  PlayCircle,
  User,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { enrollInCourse, checkEnrollmentStatus } from '@/lib/api';
import { CourseCover } from '@/components/courses/course-cover';

interface Lesson {
  id: string;
  title: string;
  order: number;
  videoUrl?: string;
  content?: string;
}

interface Course {
  imageUrl?: string | null;
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    username: string;
  };
  lessons: Lesson[];
  _count: {
    enrollments: number;
  };
}

const MINUTES_PER_LESSON = 15;

export default function CourseDetailContent({ course }: { course: Course }) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  const lessons = useMemo(() => [...course.lessons].sort((a, b) => a.order - b.order), [course.lessons]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      setCheckingEnrollment(false);
      return;
    }
    let cancelled = false;
    checkEnrollmentStatus(course.id, session.user.accessToken)
      .then((result) => !cancelled && setIsEnrolled(result.isEnrolled))
      .catch((error) => console.error('Error checking enrollment status:', error))
      .finally(() => !cancelled && setCheckingEnrollment(false));
    return () => {
      cancelled = true;
    };
  }, [session, status, course.id]);

  const handleEnroll = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/courses/${course.id}`);
      return;
    }

    try {
      setIsEnrolling(true);
      await enrollInCourse(course.id, session.user.accessToken);
      toast.success("You're enrolled. Start with the first lesson whenever you're ready.");
      setIsEnrolled(true);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      const statusCode =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { status: number } }).response?.status
          : undefined;
      if (statusCode === 409) {
        toast.info("You're already enrolled in this course.");
        setIsEnrolled(true);
      } else {
        toast.error("We couldn't enroll you right now. Please try again in a moment.");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const firstLesson = lessons[0];
  const totalMinutes = lessons.length * MINUTES_PER_LESSON;

  return (
    <div className='container-page py-8 md:py-12'>
      <Button variant='ghost' size='sm' asChild className='-ml-2 mb-6 text-muted-foreground'>
        <Link href='/courses'>
          <ArrowLeft aria-hidden='true' />
          Back to courses
        </Link>
      </Button>

      <div className='grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:gap-12'>
        <div className='min-w-0'>
          <CourseCover src={course.imageUrl} title={course.title} className='mb-8 aspect-[16/7] rounded-xl border' />
          <h1 className='text-3xl font-semibold tracking-tight text-foreground md:text-4xl'>{course.title}</h1>
          <ul className='mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground'>
            <li className='inline-flex items-center gap-1.5'>
              <User aria-hidden='true' className='size-4' />
              By <span className='font-medium text-foreground'>{course.author.username}</span>
            </li>
            <li className='inline-flex items-center gap-1.5'>
              <Users aria-hidden='true' className='size-4' />
              {course._count.enrollments} {course._count.enrollments === 1 ? 'learner' : 'learners'} enrolled
            </li>
            <li className='inline-flex items-center gap-1.5'>
              <Clock aria-hidden='true' className='size-4' />
              About {totalMinutes} min
            </li>
          </ul>

          <Tabs defaultValue='overview' className='mt-8 w-full'>
            <TabsList className='w-full sm:w-auto'>
              <TabsTrigger value='overview' className='px-4'>Overview</TabsTrigger>
              <TabsTrigger value='curriculum' className='px-4'>
                Curriculum
                <Badge variant='secondary' className='ml-1'>{lessons.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value='overview' className='pt-6'>
              <div className='space-y-8'>
                <section>
                  <h2 className='text-lg font-semibold text-foreground'>About this course</h2>
                  <p className='mt-3 whitespace-pre-line leading-7 text-muted-foreground'>
                    {course.description || 'The instructor hasn’t added a description for this course yet.'}
                  </p>
                </section>
                <section className='surface p-6'>
                  <h2 className='text-lg font-semibold text-foreground'>What you&apos;ll learn</h2>
                  <ul className='mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2'>
                    {[
                      'Gain hands-on experience with practical exercises',
                      'Build real-world projects for your portfolio',
                      'Learn at your own pace with on-demand video lectures',
                      'Receive support from instructors and the community',
                    ].map((item) => (
                      <li key={item} className='flex gap-2.5'>
                        <CheckCircle2 aria-hidden='true' className='mt-0.5 size-4 shrink-0 text-success' />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </TabsContent>

            <TabsContent value='curriculum' className='pt-6'>
              <div className='mb-4 flex flex-wrap items-baseline justify-between gap-2'>
                <h2 className='text-lg font-semibold text-foreground'>Course content</h2>
                <p className='text-sm text-muted-foreground'>
                  {lessons.length} lessons · about {totalMinutes} minutes
                </p>
              </div>

              {lessons.length > 0 ? (
                <ol className='divide-y overflow-hidden rounded-xl border bg-card'>
                  {lessons.map((lesson, index) => {
                    const body = (
                      <>
                        <span className='flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium tabular-nums text-muted-foreground'>
                          {index + 1}
                        </span>
                        <span className='min-w-0 flex-1'>
                          <span className='block truncate font-medium text-foreground'>{lesson.title}</span>
                          <span className='mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground'>
                            {lesson.videoUrl ? <PlayCircle aria-hidden='true' className='size-3.5' /> : null}
                            {lesson.videoUrl ? 'Video · ' : ''}
                            {MINUTES_PER_LESSON} min
                          </span>
                        </span>
                        {isEnrolled ? (
                          <PlayCircle aria-hidden='true' className='size-4 shrink-0 text-primary' />
                        ) : (
                          <>
                            <Lock aria-hidden='true' className='size-4 shrink-0 text-muted-foreground' />
                            <span className='sr-only'>(locked — enroll to access)</span>
                          </>
                        )}
                      </>
                    );
                    return (
                      <li key={lesson.id}>
                        {isEnrolled ? (
                          <Link
                            href={`/courses/${course.id}/lessons/${lesson.id}`}
                            className='flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted focus-visible:-outline-offset-2'
                          >
                            {body}
                          </Link>
                        ) : (
                          <div className='flex items-center gap-3 px-4 py-3'>{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <EmptyState
                  size='sm'
                  icon={ListVideo}
                  title='No lessons yet'
                  description='The instructor is still preparing this course. Check back soon.'
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        <aside aria-labelledby='enroll-heading' className='lg:sticky lg:top-24 lg:self-start'>
          <div className='surface p-6'>
            <h2 id='enroll-heading' className='text-lg font-semibold text-foreground'>
              {isEnrolled ? 'You’re enrolled' : 'Join this course'}
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              {isEnrolled ? 'Pick up where you left off.' : 'Free to enroll. Learn at your own pace.'}
            </p>

            <ul className='mt-6 space-y-3 text-sm text-foreground'>
              <li className='flex items-center gap-3'>
                <BookOpen aria-hidden='true' className='size-4 text-muted-foreground' />
                {lessons.length} lessons
              </li>
              <li className='flex items-center gap-3'>
                <Award aria-hidden='true' className='size-4 text-muted-foreground' />
                Certificate of completion
              </li>
              <li className='flex items-center gap-3'>
                <Clock aria-hidden='true' className='size-4 text-muted-foreground' />
                Full lifetime access
              </li>
              <li className='flex items-center gap-3'>
                <MonitorSmartphone aria-hidden='true' className='size-4 text-muted-foreground' />
                Access on mobile and desktop
              </li>
            </ul>

            <div className='mt-6 border-t pt-6'>
              {checkingEnrollment ? (
                <Skeleton className='h-10 w-full' />
              ) : isEnrolled ? (
                firstLesson ? (
                  <Button size='lg' className='w-full' asChild>
                    <Link href={`/courses/${course.id}/lessons/${firstLesson.id}`}>
                      <PlayCircle aria-hidden='true' />
                      Continue learning
                    </Link>
                  </Button>
                ) : (
                  <p className='text-center text-sm text-muted-foreground'>Lessons will appear here once published.</p>
                )
              ) : (
                <Button size='lg' className='w-full' onClick={handleEnroll} disabled={isEnrolling} aria-busy={isEnrolling}>
                  {isEnrolling ? <Spinner /> : null}
                  {isEnrolling ? 'Enrolling…' : session ? 'Enroll now' : 'Sign in to enroll'}
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
