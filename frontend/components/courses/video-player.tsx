'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingRegion, Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Circle,
  Clock,
  FileQuestion,
  PlayCircle,
  VideoOff,
} from 'lucide-react';
import {
  fetchCourseById,
  getCourseVideosProgress,
  updateVideoProgress,
  checkEnrollmentStatus,
} from '@/lib/api';
import { Course, Lesson, LessonWithProgress } from '@/types';

interface VideoPlayerProps {
  courseId: string;
  lessonId: string;
}

export default function VideoPlayer({ courseId, lessonId }: VideoPlayerProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadCourseData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(false);

      // Check enrollment status
      const enrollmentStatus = await checkEnrollmentStatus(
        courseId,
        session!.user.accessToken
      );

      if (!enrollmentStatus.isEnrolled) {
        toast.error(
          'You need to enroll in this course to access video lessons'
        );
        router.push(`/courses/${courseId}`);
        return;
      }

      // Get course data
      const courseData = await fetchCourseById(courseId);

      // Get video progress
      const progressData = await getCourseVideosProgress(
        courseId,
        session!.user.accessToken
      );

      // Merge course data with progress
      const lessonsWithProgress = courseData.lessons.map((lesson: Lesson) => {
        const progressLesson = progressData.lessons.find(
          (p: { id: string; completed: boolean; watchTime: number }) => p.id === lesson.id
        );
        return {
          ...lesson,
          completed: progressLesson?.completed || false,
          watchTime: progressLesson?.watchTime || 0,
        };
      });

      setCourse({
        ...courseData,
        lessons: lessonsWithProgress.sort(
          (a: LessonWithProgress, b: LessonWithProgress) => a.order - b.order
        ),
      });

      setOverallProgress(progressData.overallProgress);

      // Set current lesson
      const current = lessonsWithProgress.find((l: LessonWithProgress) => l.id === lessonId);
      setCurrentLesson(current || null);
    } catch (error) {
      console.error('Error loading course data:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, lessonId, session, router]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    loadCourseData();
  }, [status, session, loadCourseData, router]);

  const extractYouTubeId = (url: string): string | null => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const markAsCompleted = async () => {
    if (!currentLesson || !session) return;

    try {
      setIsMarkingComplete(true);

      await updateVideoProgress(
        {
          lessonId: currentLesson.id,
          courseId: courseId,
          completed: true,
        },
        session.user.accessToken
      );

      // Update progress locally so the page doesn't flash back to a skeleton.
      setCurrentLesson((lesson) => (lesson ? { ...lesson, completed: true } : lesson));
      const refreshed = await getCourseVideosProgress(courseId, session.user.accessToken).catch(() => null);
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              lessons: prev.lessons.map((l) => (l.id === currentLesson.id ? { ...l, completed: true } : l)),
            }
          : prev
      );
      if (refreshed) setOverallProgress(refreshed.overallProgress);
      toast.success('Lesson marked as complete.');
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      toast.error("We couldn't save your progress. Please try again.");
    } finally {
      setIsMarkingComplete(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingRegion label='Loading lesson' className='grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]'>
        <div className='space-y-5'>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='h-9 w-2/3' />
          <Skeleton className='aspect-video w-full rounded-xl' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-4/5' />
        </div>
        <div className='surface space-y-3 p-5'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-2 w-full' />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-12 w-full' />
          ))}
        </div>
      </LoadingRegion>
    );
  }

  if (loadError) {
    return (
      <ErrorState
        title="Couldn't load this lesson"
        message='We had trouble loading the course and your progress. Check your connection and try again.'
        onRetry={loadCourseData}
        action={
          <Button variant='ghost' asChild>
            <Link href={`/courses/${courseId}`}>Back to course</Link>
          </Button>
        }
      />
    );
  }

  if (!course || !currentLesson) {
    return (
      <EmptyState
        icon={FileQuestion}
        title='Lesson not found'
        description='This lesson may have been removed or moved to another course.'
        action={
          <Button asChild>
            <Link href={`/courses/${courseId}`}>Back to course</Link>
          </Button>
        }
      />
    );
  }

  const youtubeId = currentLesson.videoUrl ? extractYouTubeId(currentLesson.videoUrl) : null;
  const completedLessons = course.lessons.filter((l) => l.completed).length;
  const totalLessons = course.lessons.length;
  const currentIndex = course.lessons.findIndex((l) => l.id === currentLesson.id);
  const nextLesson = currentIndex >= 0 ? course.lessons[currentIndex + 1] : undefined;
  const allComplete = totalLessons > 0 && completedLessons === totalLessons;

  return (
    <div className='grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]'>
      <article className='min-w-0'>
        <Button variant='ghost' size='sm' asChild className='-ml-2 mb-4 text-muted-foreground'>
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft aria-hidden='true' />
            {course.title}
          </Link>
        </Button>

        <div className='mb-6 flex flex-wrap items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='eyebrow'>
              Lesson {currentIndex + 1} of {totalLessons}
            </p>
            <h1 className='mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl'>
              {currentLesson.title}
            </h1>
          </div>
          {currentLesson.completed ? (
            <Badge variant='success' className='mt-1'>
              <CheckCircle2 aria-hidden='true' />
              Completed
            </Badge>
          ) : null}
        </div>

        {youtubeId ? (
          <div className='relative mb-8 aspect-video w-full overflow-hidden rounded-xl border bg-black'>
            <iframe
              className='absolute inset-0 h-full w-full'
              src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&origin=${window.location.origin}`}
              title={`Video: ${currentLesson.title}`}
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
              allowFullScreen
            />
          </div>
        ) : (
          <EmptyState
            icon={VideoOff}
            title='No video for this lesson'
            description='This lesson is reading-only. Work through the notes below, then mark it complete.'
            className='mb-8 bg-muted/40'
          />
        )}

        {currentLesson.content ? (
          <section className='mb-8'>
            <h2 className='text-lg font-semibold text-foreground'>About this lesson</h2>
            <p className='mt-3 max-w-prose whitespace-pre-line leading-7 text-muted-foreground'>
              {currentLesson.content}
            </p>
          </section>
        ) : null}

        <div className='flex flex-col gap-3 border-t pt-6 sm:flex-row'>
          {!currentLesson.completed ? (
            <Button onClick={markAsCompleted} disabled={isMarkingComplete} aria-busy={isMarkingComplete} size='lg'>
              {isMarkingComplete ? <Spinner /> : <CheckCircle2 aria-hidden='true' />}
              {isMarkingComplete ? 'Saving…' : 'Mark as complete'}
            </Button>
          ) : null}
          {nextLesson ? (
            <Button variant={currentLesson.completed ? 'default' : 'outline'} size='lg' asChild>
              <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`}>
                Next lesson
                <PlayCircle aria-hidden='true' />
              </Link>
            </Button>
          ) : null}
          {allComplete ? (
            <Button variant='outline' size='lg' asChild>
              <Link href={`/courses/${courseId}/certificate`}>
                <Award aria-hidden='true' />
                Get certificate
              </Link>
            </Button>
          ) : null}
        </div>
      </article>

      <aside aria-labelledby='lesson-list-heading' className='lg:sticky lg:top-24 lg:self-start'>
        <div className='surface overflow-hidden'>
          <div className='space-y-3 border-b p-5'>
            <h2 id='lesson-list-heading' className='font-semibold text-foreground'>
              Course progress
            </h2>
            <div className='flex justify-between text-sm text-muted-foreground'>
              <span>{Math.round(overallProgress)}% complete</span>
              <span className='tabular-nums'>
                {completedLessons}/{totalLessons} lessons
              </span>
            </div>
            <Progress value={overallProgress} aria-label='Course progress' />
          </div>

          <ol className='max-h-[60vh] space-y-1 overflow-y-auto p-2'>
            {course.lessons.map((lesson, index) => {
              const isCurrent = lesson.id === currentLesson.id;
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/courses/${courseId}/lessons/${lesson.id}`}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                      isCurrent ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    {lesson.completed ? (
                      <CheckCircle2 aria-hidden='true' className='size-5 shrink-0 text-success' />
                    ) : isCurrent ? (
                      <PlayCircle aria-hidden='true' className='size-5 shrink-0 text-primary' />
                    ) : (
                      <Circle aria-hidden='true' className='size-5 shrink-0 text-muted-foreground' />
                    )}
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate text-sm font-medium'>{lesson.title}</span>
                      <span className='text-xs text-muted-foreground'>
                        Lesson {index + 1}
                        {lesson.completed ? <span className='sr-only'>, completed</span> : null}
                      </span>
                    </span>
                    {lesson.watchTime ? (
                      <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <Clock aria-hidden='true' className='size-3' />
                        {Math.floor(lesson.watchTime / 60)}m
                        <span className='sr-only'> watched</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>
    </div>
  );
}
