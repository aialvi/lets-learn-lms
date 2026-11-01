import Link from "next/link";
import { BookOpen } from "lucide-react";

/** Minimal full-page shell for 404 / error screens (no auth-dependent nav). */
export function StatusPage({
  code,
  title,
  description,
  children,
}: {
  code?: string;
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container-page flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 rounded-md font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BookOpen aria-hidden="true" className="size-4" />
            </span>
            Let&apos;s Learn
          </Link>
        </div>
      </header>
      <main id="main-content" className="container-page flex flex-1 flex-col items-center justify-center py-20 text-center">
        {code ? <p className="eyebrow mb-3 text-primary">{code}</p> : null}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">{description}</p>
        {children ? <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div> : null}
      </main>
    </div>
  );
}
