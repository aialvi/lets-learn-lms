import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t bg-card py-12">
      <div className="container-page grid grid-cols-1 gap-8 md:grid-cols-4">
        <div className="space-y-3">
          <span className="text-base font-semibold tracking-tight text-foreground">
            Let&apos;s Learn
          </span>
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">
            Focused online courses for practical skills, guided lessons, and steady progress.
          </p>
        </div>
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-foreground">Platform</h5>
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
        </div>
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-foreground">Resources</h5>
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
        </div>
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-foreground">Legal</h5>
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
        </div>
      </div>
      <div className="container-page mt-10 border-t pt-6 text-xs text-muted-foreground">
        © 2026 Let&apos;s Learn. All rights reserved.
      </div>
    </footer>
  );
}
