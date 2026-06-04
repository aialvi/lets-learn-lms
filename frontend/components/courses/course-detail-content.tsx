'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  User,
  Users,
  CheckCircle,
  Lock,
  ArrowLeft,
  PlayCircle,
} from 'lucide-react';
import { enrollInCourse, checkEnrollmentStatus } from '@/lib/api';

interface Lesson {
  id: string;
  title: string;
  order: number;
  videoUrl?: string;
  content?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    username: string;
  };
  lessons: Lesson[];
  _count: {
    lessons: number;
    enrollments: number;
  };
}

export default function CourseDetailContent({ course }: { course: Course }) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkEnrollment = async () => {
      if (!session) return;
      
      try {
        const status = await checkEnrollmentStatus(course.id, session.user.accessToken);
        setIsEnrolled(status.isEnrolled);
      } catch (error) {
        console.error('Error checking enrollment status:', error);
      }
    };

    if (session) {
      checkEnrollment();
    }
  }, [session, course.id]);

  const handleEnroll = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/courses/${course.id}`);
      return;
    }

    try {
      setIsEnrolling(true);
      await enrollInCourse(course.id, session.user.accessToken);

      toast("You've successfully enrolled in this course.");
      setIsEnrolled(true);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 409) {
          toast("You're already enrolled in this course!");
          setIsEnrolled(true);
        } else {
          toast('There was an error enrolling you in this course. Please try again.');
        }
      } else {
        toast('There was an error enrolling you in this course. Please try again.');
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleViewCourse = () => {
    if (course.lessons.length > 0) {
      const firstLesson = course.lessons.sort((a, b) => a.order - b.order)[0];
      router.push(`/courses/${course.id}/lessons/${firstLesson.id}`);
    } else {
      toast('This course has no lessons yet.');
    }
  };

  return (
    <div className='container-page py-12'>
      <Button
        variant='ghost'
        className='mb-6'
        onClick={() => router.push('/courses')}
      >
        <ArrowLeft className='mr-2 h-4 w-4' /> Back to courses
      </Button>

      <div className='grid gap-8 md:grid-cols-[2fr_1fr]'>
        <div>
          <h1 className='mb-3 text-4xl font-semibold tracking-tight text-foreground'>
            {course.title}
          </h1>
          <div className='mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
            <User className='h-4 w-4' />
            <span>Created by {course.author.username}</span>
            <span className='text-muted-foreground mx-2'>•</span>
            <Users className='h-4 w-4' />
            <span>{course._count.enrollments} students enrolled</span>
          </div>

          <Tabs defaultValue='overview' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='curriculum'>Curriculum</TabsTrigger>
            </TabsList>
            <TabsContent value='overview' className='py-4'>
              <div className='rounded-lg border bg-card p-6'>
                <h3 className='text-lg font-semibold text-foreground'>About this course</h3>
                <p className='mt-3 leading-7 text-muted-foreground'>
                  {course.description ||
                    'No description available for this course.'}
                </p>

                <h3 className='mt-8 text-lg font-semibold text-foreground'>What you&apos;ll learn</h3>
                <ul className='mt-4 space-y-3 text-sm text-muted-foreground'>
                  <li>Gain hands-on experience with practical exercises</li>
                  <li>Build real-world projects for your portfolio</li>
                  <li>Learn at your own pace with on-demand video lectures</li>
                  <li>Receive support from instructors and the community</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value='curriculum' className='py-4'>
              <h3 className='text-xl font-semibold mb-4'>Course Content</h3>
              <div className='text-sm text-muted-foreground mb-6'>
                {course._count.lessons} lessons • Approximately{' '}
                {course._count.lessons * 15} minutes total length
              </div>

              {course.lessons.length > 0 ? (
                <div className='space-y-3'>
                  {course.lessons
                    .sort((a, b) => a.order - b.order)
                    .map((lesson, index) => (
                      <Card key={lesson.id} className='overflow-hidden'>
                        <CardContent className='p-4'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium'>
                                {index + 1}
                              </div>
                              <div>
                                <div className='font-medium'>
                                  {lesson.title}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                  15 min
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 cursor-pointer">
                              {lesson.videoUrl && (
                                <PlayCircle className="h-4 w-4 text-primary" />
                              )}
                              {isEnrolled ? (
                                <CheckCircle className='h-4 w-4 text-primary' />
                              ) : (
                                <Lock className='h-4 w-4 text-muted-foreground' />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className='text-center py-8 border rounded-lg'>
                  <p className='text-muted-foreground'>
                    No lessons available yet.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card className='sticky top-24'>
            <CardHeader>
              <CardTitle>Join This Course</CardTitle>
              <CardDescription>Enroll now to start learning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                  <BookOpen className='h-4 w-4' />
                  <span>{course._count.lessons} lessons</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-4 w-4' />
                  <span>Certificate of completion</span>
                </div>
              </div>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-4 w-4 text-primary' />
                  <span>Full lifetime access</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-4 w-4 text-primary' />
                  <span>Access on mobile and desktop</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-4 w-4 text-primary' />
                  <span>Project files & resources</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {isEnrolled ? (
                <div className="w-full space-y-2">
                  <Button
                    className="w-full cursor-pointer"
                    onClick={handleViewCourse}
                    variant="default"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Continue Learning
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    You&apos;re enrolled in this course!
                  </p>
                </div>
              ) : (
                <Button
                  className="w-full cursor-pointer"
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
