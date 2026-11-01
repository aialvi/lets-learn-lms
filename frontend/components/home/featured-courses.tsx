"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { fetchCourses } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingRegion } from "@/components/ui/skeleton";
import { CourseCard, CourseCardSkeleton, type CourseSummary } from "@/components/courses/course-card";

export function FeaturedCourses() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const data: CourseSummary[] = await fetchCourses();
      setCourses(data.slice(0, 3));
    } catch (err) {
      console.error("Error loading courses:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return (
    <section aria-labelledby="featured-heading" className="border-b bg-card py-16 md:py-24">
      <div className="container-page">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="eyebrow">Featured courses</p>
            <h2 id="featured-heading" className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Start with courses built around real outcomes
            </h2>
          </div>
          <Button asChild variant="outline" className="w-fit">
            <Link href="/courses">
              View catalog
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <LoadingRegion label="Loading featured courses" className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </LoadingRegion>
        ) : error ? (
          <ErrorState
            title="Couldn't load featured courses"
            message="We'll keep trying in the background. You can still browse the full catalog."
            onRetry={loadCourses}
          />
        ) : courses.length > 0 ? (
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {courses.map((course) => (
              <li key={course.id}>
                <CourseCard course={course} headingLevel="h3" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Courses will show up here once instructors publish them."
          />
        )}
      </div>
    </section>
  );
}
