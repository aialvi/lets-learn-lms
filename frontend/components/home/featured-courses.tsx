"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, User, Users } from "lucide-react";
import { fetchCourses } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { truncateText } from "@/lib/utils";

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

export function FeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchCourses();
        setCourses(data.slice(0, 3));
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, []);

  return (
    <section className="border-b bg-card py-20">
      <div className="container-page">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <span className="eyebrow">Featured courses</span>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Start with courses built around real outcomes.
            </h2>
          </div>
          <Button asChild variant="outline" className="w-fit font-semibold">
            <Link href="/courses">
              View catalog
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-lg border bg-background p-5">
                <div className="mb-8 h-9 w-9 rounded-md bg-muted" />
                <div className="mb-3 h-5 w-4/5 rounded bg-muted" />
                <div className="h-16 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="group">
                <article className="flex h-full min-h-72 flex-col rounded-lg border bg-background p-5 transition-colors hover:border-primary/45">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-md border bg-card text-primary">
                      <BookOpen className="size-5" />
                    </span>
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {course._count.lessons} lessons
                    </span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-semibold leading-7 text-foreground group-hover:text-primary">
                      {course.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {truncateText(course.description || "No description available", 130)}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="size-3.5" />
                      {course.author.username}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {course._count.enrollments}
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-background p-10 text-center text-sm text-muted-foreground">
            No courses available at the moment.
          </div>
        )}
      </div>
    </section>
  );
}
