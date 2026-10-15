'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  PlayCircle,
  Lock,
  ArrowLeft,
  Download,
  Clock,
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

  const loadCourseData = useCallback(async () => {
    try {
      setIsLoading(true);

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
      toast.error('Failed to load course data');
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

      toast.success('Lesson marked as completed!');

      // Reload data to update progress
      await loadCourseData();
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      toast.error('Failed to mark lesson as completed');
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const navigateToLesson = (lesson: Lesson) => {
    router.push(`/courses/${courseId}/lessons/${lesson.id}`);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold mb-4'>Lesson not found</h2>
          <Button onClick={() => router.push(`/courses/${courseId}`)}>
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  const youtubeId = currentLesson.videoUrl ? extractYouTubeId(currentLesson.videoUrl) : null;
  const completedLessons = course.lessons.filter((l) => l.completed).length;
  const totalLessons = course.lessons.length;

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
      {/* Main Video Player */}
      <div className='lg:col-span-2'>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <Button
                variant='ghost'
                onClick={() => router.push(`/courses/${courseId}`)}
                className='mb-4'
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back to Course
              </Button>

              {currentLesson.completed && (
                <Badge variant='secondary' className='mb-4'>
                  <CheckCircle className='h-4 w-4 mr-1' />
                  Completed
                </Badge>
              )}
            </div>

            <CardTitle className='text-2xl'>{currentLesson.title}</CardTitle>

            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
              <span>Lesson {currentLesson.order}</span>
              <span>•</span>
              <span>{course.title}</span>
            </div>
          </CardHeader>

          <CardContent>
            {/* YouTube Video Player */}
            {youtubeId ? (
              <div className='relative w-full pb-[56.25%] mb-6'>
                <iframe
                  className='absolute top-0 left-0 w-full h-full rounded-lg'
                  src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&origin=${window.location.origin}`}
                  title={currentLesson.title}
                  frameBorder='0'
                  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className='bg-gray-100 rounded-lg p-8 text-center mb-6'>
                <PlayCircle className='h-16 w-16 mx-auto mb-4 text-gray-400' />
                <p className='text-gray-600'>Video not available</p>
              </div>
            )}

            {/* Lesson Content */}
            {currentLesson.content && (
              <div className='mb-6'>
                <h3 className='text-lg font-semibold mb-3'>
                  About this lesson
                </h3>
                <div className='prose max-w-none'>
                  <p className='text-muted-foreground'>
                    {currentLesson.content}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex gap-3'>
              {!currentLesson.completed && (
                <Button
                  onClick={markAsCompleted}
                  disabled={isMarkingComplete}
                  className='flex-1'
                >
                  {isMarkingComplete ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Marking Complete...
                    </>
                  ) : (
                    <>
                      <CheckCircle className='h-4 w-4 mr-2' />
                      Mark as Complete
                    </>
                  )}
                </Button>
              )}

              {completedLessons === totalLessons && (
                <Button
                  variant='outline'
                  onClick={() =>
                    router.push(`/courses/${courseId}/certificate`)
                  }
                  className='flex-1 cursor-pointer'
                >
                  <Download className='h-4 w-4 mr-2' />
                  Get Certificate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Playlist Sidebar */}
      <div className='lg:col-span-1'>
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Progress</span>
                <span>
                  {completedLessons}/{totalLessons} lessons
                </span>
              </div>
              <Progress value={overallProgress} className='w-full' />
            </div>
          </CardHeader>

          <CardContent>
            <div className='space-y-3'>
              {course.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    lesson.id === currentLesson.id
                      ? 'bg-primary/5 border-primary'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => navigateToLesson(lesson)}
                >
                  <div className='flex-shrink-0'>
                    {lesson.completed ? (
                      <CheckCircle className='h-5 w-5 text-green-600' />
                    ) : lesson.videoUrl ? (
                      <PlayCircle className='h-5 w-5 text-primary' />
                    ) : (
                      <Lock className='h-5 w-5 text-gray-400' />
                    )}
                  </div>

                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-sm truncate'>
                      {lesson.title}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Lesson {lesson.order}
                    </p>
                  </div>

                  {lesson.watchTime && lesson.watchTime > 0 && (
                    <div className='flex items-center text-xs text-muted-foreground'>
                      <Clock className='h-3 w-3 mr-1' />
                      {Math.floor(lesson.watchTime / 60)}m
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
