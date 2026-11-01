"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/layout/status-page";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      title="This page ran into a problem"
      description={
        <>
          Something unexpected happened while loading this page. Your progress is saved — try again, or go back to
          the homepage.
          {error.digest ? (
            <span className="mt-2 block font-mono text-xs">Reference: {error.digest}</span>
          ) : null}
        </>
      }
    >
      <Button onClick={reset}>
        <RotateCcw aria-hidden="true" />
        Try again
      </Button>
      <Button asChild variant="outline">
        <Link href="/">Go to homepage</Link>
      </Button>
    </StatusPage>
  );
}
