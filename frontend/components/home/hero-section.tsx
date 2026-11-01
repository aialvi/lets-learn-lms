'use client';

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const pathLessons: Array<[string, string, boolean]> = [
  ["Research methods", "Complete", true],
  ["Wireframe systems", "42 min", true],
  ["Design critique", "Next", false],
];

export function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="w-full border-b bg-background py-16 md:py-24">
      <div className="container-page grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-3xl space-y-8">
          <p className="eyebrow">Online learning platform</p>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Learn practical skills with calm, focused courses.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Browse curated courses, follow clear lessons, and keep your progress in one minimal workspace built for consistent learning.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6">
              <Link href="/courses">
                Browse courses
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            {!user && (
              <Button asChild variant="outline" size="lg" className="h-11 px-6">
                <Link href="/auth/signup">Create account</Link>
              </Button>
            )}
          </div>
          <dl className="grid max-w-2xl grid-cols-3 gap-4 border-t pt-6">
            {[
              ["50k+", "Learners"],
              ["120+", "Lessons"],
              ["24/7", "Access"],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col-reverse">
                <dt className="mt-1 text-sm text-muted-foreground">{label}</dt>
                <dd className="text-2xl font-semibold tabular-nums text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div aria-hidden="true" className="surface p-3 shadow-lg sm:p-4">
          <div className="rounded-lg border bg-background p-5">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Current path</p>
                <p className="text-sm text-muted-foreground">Product design foundations</p>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                68%
              </span>
            </div>

            <div className="space-y-3">
              {pathLessons.map(([title, meta, active]) => (
                <div
                  key={title}
                  className={`flex items-center gap-3 rounded-md border bg-card p-4 ${
                    active ? "border-border" : "border-primary/35"
                  }`}
                >
                  <span className={`flex size-9 items-center justify-center rounded-md ${active ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                    {active ? <CheckCircle2 className="size-4 text-success" /> : <PlayCircle className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{meta}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <BookOpen className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Guided learning</p>
                  <p className="text-sm text-muted-foreground">Lessons, progress, and course materials stay organized.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
