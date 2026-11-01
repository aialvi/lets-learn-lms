"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { BookOpen, LogOut, Menu, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close the mobile menu on navigation.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Escape closes the mobile menu and returns focus to its toggle.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

  const navItems = [
    ...(session
      ? [
          { name: "Dashboard", path: "/dashboard" },
          { name: "Organizations", path: "/organizations" },
        ]
      : []),
    { name: "Browse", path: "/courses" },
  ];

  const linkClass = (active: boolean) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 rounded-md">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BookOpen aria-hidden="true" className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">Let&apos;s Learn</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-current={active ? "page" : undefined}
                  className={linkClass(active)}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {status === "loading" ? (
            <Skeleton className="h-9 w-40" />
          ) : status === "authenticated" ? (
            <>
              <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/profile" aria-current={isActive("/profile") ? "page" : undefined}>
                  <User aria-hidden="true" className="size-4" />
                  <span className="sr-only">Profile</span>
                </Link>
              </Button>
              <Button variant="ghost" onClick={() => signOut()} className="text-muted-foreground hover:text-foreground">
                <LogOut aria-hidden="true" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            ref={toggleRef}
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls={menuId}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="text-muted-foreground"
          >
            {mobileMenuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          </Button>
        </div>
      </div>

      <div
        id={menuId}
        hidden={!mobileMenuOpen}
        className="absolute inset-x-0 top-16 border-b bg-background shadow-md md:hidden"
      >
        <div className="container-page flex flex-col gap-5 py-5">
          <nav aria-label="Main" className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-current={active ? "page" : undefined}
                  className={cn(linkClass(active), "text-base")}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-col gap-2 border-t pt-4">
            {status === "authenticated" ? (
              <>
                <Button variant="ghost" asChild className="justify-start text-muted-foreground">
                  <Link href="/profile">
                    <User aria-hidden="true" />
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" onClick={() => signOut()} className="justify-start text-muted-foreground">
                  <LogOut aria-hidden="true" />
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
