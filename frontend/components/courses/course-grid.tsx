"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, User, Users } from "lucide-react";
import { fetchCourses } from "@/lib/api";

interface Course {
  id: string;
  title: string;
  description: string;
  author: {
    username: string;
  };
  _count: {
    lessons: number;
    enrollments: number;
  };
}

export function CourseGrid() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("popular");

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchCourses();
        setCourses(data);
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, []);

  const sortedCourses = useMemo(() => {
    const result = [...courses];
    if (sortBy === "popular") {
      result.sort((a, b) => b._count.enrollments - a._count.enrollments);
    }
    if (sortBy === "lessons") {
      result.sort((a, b) => b._count.lessons - a._count.lessons);
    }
    if (sortBy === "alphabetical") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [courses, sortBy]);

  return (
    <div className="flex-1">
      <div className="mb-6 flex flex-col gap-4 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{courses.length}</span> courses available
        </p>
        <label className="flex items-center gap-3 text-sm text-muted-foreground">
          Sort
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="popular">Most popular</option>
            <option value="lessons">Most lessons</option>
            <option value="alphabetical">A-Z</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-lg border bg-card p-5">
              <div className="mb-6 h-10 w-10 rounded-md bg-muted" />
              <div className="mb-3 h-5 w-4/5 rounded bg-muted" />
              <div className="h-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedCourses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} className="group">
              <article className="flex h-full min-h-72 flex-col rounded-lg border bg-card p-5 transition-colors hover:border-primary/45">
                <div className="mb-6 flex items-start justify-between">
                  <span className="flex size-10 items-center justify-center rounded-md border bg-background text-primary">
                    <BookOpen className="size-5" />
                  </span>
                  <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {course._count.lessons} lessons
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold leading-7 text-foreground group-hover:text-primary">
                    {course.title}
                  </h3>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">
                    {course.description || "Learn from practical lessons and structured exercises."}
                  </p>
                </div>

                <div className="mt-6 space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="size-3.5" />
                      {course.author.username}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {course._count.enrollments} enrolled
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    View course
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
