import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  competitiveLmsFeatures,
  growthSignals,
  socialLearningPrompts,
} from '@/lib/growth-features';

export function GrowthFeatures() {
  return (
    <section className="border-b bg-background py-20">
      <div className="container-page">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="space-y-3">
            <p className="eyebrow">Built for learning</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              More than course delivery.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground lg:ml-auto">
            Modern LMS buyers expect personalization, skills intelligence,
            measurable outcomes, and lightweight practice loops. Let&apos;s Learn
            now surfaces those workflows directly in the product experience.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {competitiveLmsFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-lg border bg-card p-5">
                <div className="mb-5 flex size-10 items-center justify-center rounded-md border bg-background text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-4">
              {growthSignals.map((signal) => (
                <div key={signal.label} className="rounded-md border bg-background p-4">
                  <p className="text-xs text-muted-foreground">{signal.label}</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{signal.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <div className="space-y-4">
              {socialLearningPrompts.map((prompt) => {
                const Icon = prompt.icon;
                return (
                  <div key={prompt.title} className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{prompt.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {prompt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="font-semibold">
            <Link href="/dashboard">
              Open learner cockpit
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="font-semibold">
            <Link href="/courses">Browse skill paths</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
