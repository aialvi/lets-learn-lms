import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t bg-card py-12">
      <h2 className="sr-only">Footer</h2>
      <div className="container-page grid grid-cols-1 gap-8 md:grid-cols-4">
        <div className="space-y-3">
          <p className="text-base font-semibold tracking-tight text-foreground">
            Let&apos;s Learn
          </p>
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">
            Focused online courses for practical skills, guided lessons, and steady progress.
          </p>
        </div>
        <nav aria-label="Platform" className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Platform</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link className="transition-colors hover:text-foreground" href="/courses">
                All Courses
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-foreground" href="/about">
                About Us
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Resources" className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Resources</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link className="transition-colors hover:text-foreground" href="/help">
                Help Center
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-foreground" href="/contact">
                Contact
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Legal" className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Legal</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link className="transition-colors hover:text-foreground" href="/terms">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-foreground" href="/privacy">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="container-page mt-10 border-t pt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Let&apos;s Learn. All rights reserved.
      </div>
    </footer>
  );
}
