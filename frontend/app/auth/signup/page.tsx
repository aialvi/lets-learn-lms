import { SignUpForm } from "@/components/auth/sign-up-form";
import { Footer } from "@/components/layout/footer";
import { MainNav } from "@/components/layout/main-nav";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <SignUpForm />
      </main>
      <Footer />
    </div>
  );
}
