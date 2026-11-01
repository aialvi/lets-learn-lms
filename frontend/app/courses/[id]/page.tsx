import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchCourseById } from '@/lib/api';
import CourseDetailContent from '@/components/courses/course-detail-content';
import { Footer } from '@/components/layout/footer';
import { MainNav } from '@/components/layout/main-nav';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const course = await fetchCourseById(id);

    return {
      title: course.title,
      description:
        course.description || "Join this course on Let's Learn platform",
    };
  } catch {
    return {
      title: 'Course not found',
      description: 'The requested course could not be found.',
    };
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  try {
    const course = await fetchCourseById(id);
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MainNav />
        <main id="main-content" className="flex-1">
          <CourseDetailContent course={course} />
        </main>
        <Footer />
      </div>
    );
  } catch {
    notFound();
  }
}
