import { Metadata } from 'next';
import VideoPlayer from '@/components/courses/video-player';
import { MainNav } from '@/components/layout/main-nav';

export const metadata: Metadata = {
  title: 'Lesson',
  description: 'Watch video lessons and track your progress',
};

interface LessonPageProps {
  params: Promise<{
    id: string;
    lessonId: string;
  }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id, lessonId } = await params;

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <MainNav />
      <main id='main-content' className='container-page flex-1 py-6 md:py-10'>
        <VideoPlayer courseId={id} lessonId={lessonId} />
      </main>
    </div>
  );
}
