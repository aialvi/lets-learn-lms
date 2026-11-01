import Link from 'next/link';
import { ArrowRight, BookOpen, User, Users } from 'lucide-react';
import { CourseCover } from '@/components/courses/course-cover';
import { Skeleton } from '@/components/ui/skeleton';

export interface CourseSummary {
  imageUrl?: string | null;
  id: string;
  title: string;
  description: string;
  author: { username: string };
  _count: { lessons: number; enrollments: number };
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Whole card is one link (single tab stop); the title is the accessible name
 * and the remaining text is read as its description.
 */
export function CourseCard({
  course,
  headingLevel = 'h3',
}: {
  course: CourseSummary;
  headingLevel?: 'h2' | 'h3';
}) {
  const Heading = headingLevel;
  return (
    <article className="group surface relative flex h-full flex-col overflow-hidden transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md focus-within:border-primary/40">
      <CourseCover src={course.imageUrl} title={course.title} className="aspect-video" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <BookOpen aria-hidden="true" className="size-3.5" />
          {plural(course._count.lessons, 'lesson')}
        </div>
        <Heading className="text-lg font-semibold leading-snug text-foreground">
          <Link
            href={`/courses/${course.id}`}
            className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring group-hover:text-primary"
          >
            {course.title}
          </Link>
        </Heading>
        <p className="line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">
          {course.description || 'Learn from practical lessons and structured exercises.'}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <User aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">{course.author.username}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <Users aria-hidden="true" className="size-3.5" />
            {course._count.enrollments} enrolled
          </span>
        </div>
        <span aria-hidden="true" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          View course
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between border-t pt-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}
