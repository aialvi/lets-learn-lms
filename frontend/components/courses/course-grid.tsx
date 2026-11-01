"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { fetchCourses } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingRegion } from "@/components/ui/skeleton";
import { CourseCard, CourseCardSkeleton, type CourseSummary } from "@/components/courses/course-card";
import {
  FilterSidebar,
  matchesLength,
  type CourseFilters,
} from "@/components/courses/filter-sidebar";

const emptyFilters: CourseFilters = { query: "", lengths: [] };

/** Course catalog: owns data loading, filtering, and sorting. */
export function CourseGrid() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortBy, setSortBy] = useState("popular");
  const [filters, setFilters] = useState<CourseFilters>(emptyFilters);
  const sortId = useId();

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      setCourses(await fetchCourses());
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

  const visibleCourses = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const result = courses.filter(
      (c) =>
        matchesLength(c._count.lessons, filters.lengths) &&
        (!q ||
          c.title.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q) ||
          c.author.username.toLowerCase().includes(q))
    );
    if (sortBy === "popular") result.sort((a, b) => b._count.enrollments - a._count.enrollments);
    if (sortBy === "lessons") result.sort((a, b) => b._count.lessons - a._count.lessons);
    if (sortBy === "alphabetical") result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [courses, sortBy, filters]);

  const resetFilters = () => setFilters(emptyFilters);
  const filtered = visibleCourses.length !== courses.length;

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <FilterSidebar filters={filters} onChange={setFilters} onReset={resetFilters} />

      <section aria-label="Courses" className="min-w-0 flex-1">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {isLoading ? (
              "Loading courses…"
            ) : (
              <>
                Showing <span className="font-semibold text-foreground">{visibleCourses.length}</span>
                {filtered ? ` of ${courses.length}` : ""} {courses.length === 1 ? "course" : "courses"}
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor={sortId} className="text-sm text-muted-foreground">
              Sort by
            </label>
            <select
              id={sortId}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm font-medium text-foreground shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
            >
              <option value="popular">Most popular</option>
              <option value="lessons">Most lessons</option>
              <option value="alphabetical">A–Z</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingRegion label="Loading courses" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </LoadingRegion>
        ) : error ? (
          <ErrorState
            title="Couldn't load courses"
            message="The course catalog isn't responding right now. Check your connection and try again."
            onRetry={loadCourses}
          />
        ) : courses.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No courses published yet"
            description="New courses will appear here as soon as instructors publish them."
          />
        ) : visibleCourses.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No courses match your filters"
            description="Try a different search term or remove a filter to see more courses."
            action={
              <Button type="button" variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCourses.map((course) => (
              <li key={course.id}>
                <CourseCard course={course} headingLevel="h3" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
