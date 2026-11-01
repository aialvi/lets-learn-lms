import { Metadata } from 'next';
import { Footer } from '@/components/layout/footer';
import { MainNav } from '@/components/layout/main-nav';
import { CourseGrid } from '@/components/courses/course-grid';

export const metadata: Metadata = {
  title: 'Courses',
  description: "Browse all available courses on the Let's Learn platform",
};

export default function CoursesPage() {
  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <MainNav />
      <main id='main-content' className='flex-1 py-10 md:py-14'>
        <div className='container-page space-y-10'>
          <header className='max-w-3xl space-y-3'>
            <p className='eyebrow'>Course catalog</p>
            <h1 className='text-3xl font-semibold tracking-tight text-foreground md:text-5xl'>
              Find a focused path for your next skill
            </h1>
            <p className='page-description'>
              Browse practical lessons and structured learning paths from the Let&apos;s Learn catalog.
            </p>
          </header>
          <CourseGrid />
        </div>
      </main>
      <Footer />
    </div>
  );
}
