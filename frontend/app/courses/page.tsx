import { Metadata } from 'next';
import { Footer } from '@/components/layout/footer';
import { MainNav } from '@/components/layout/main-nav';
import { FilterSidebar } from '@/components/courses/filter-sidebar';
import { CourseGrid } from '@/components/courses/course-grid';

export const metadata: Metadata = {
  title: "Courses | Let's Learn",
  description: "Browse all available courses on Let's Learn platform",
};

export default function CoursesPage() {
  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <MainNav />
      <main className='flex-1 py-14 md:py-20'>
        <div className='container-page'>
          <header className='mb-10 max-w-3xl space-y-4'>
            <span className='eyebrow'>Course catalog</span>
            <h1 className='text-4xl font-semibold tracking-tight text-foreground md:text-6xl'>
              Find a focused path for your next skill.
            </h1>
            <p className='text-lg leading-8 text-muted-foreground'>
              Browse practical lessons and structured learning paths from the Let&apos;s Learn catalog.
            </p>
          </header>

          <div className='flex flex-col gap-6 lg:flex-row'>
            <FilterSidebar />
            <CourseGrid />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
