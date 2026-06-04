'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturedCourses } from '@/components/home/featured-courses';

export default function Home() {
  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <MainNav />
      <main className='flex-1 w-full'>
        <HeroSection />
        <FeaturedCourses />

        <section className="bg-background py-20">
          <div className="container-page">
            <div className="grid gap-8 rounded-lg border bg-card p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  Ready to start learning?
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  Create a free account, save courses, and pick up where you left off.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="font-semibold">
                  <Link href="/auth/signup">Create account</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-semibold">
                  <Link href="/contact">Contact us</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
