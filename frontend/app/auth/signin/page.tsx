'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SignInForm } from "@/components/auth/sign-in-form";
import { Footer } from "@/components/layout/footer";
import { MainNav } from "@/components/layout/main-nav";

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MainNav />
        <main className="flex flex-1 items-center justify-center px-5 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If user is authenticated, they will be redirected, so this won't render
  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <SignInForm />
      </main>
      <Footer />
    </div>
  );
}
