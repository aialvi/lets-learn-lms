'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Course artwork. Covers are decorative by default because the course title is
 * always rendered next to them; pass `alt` when the image carries meaning.
 */
export function CourseCover({
  src,
  title,
  alt = '',
  className = '',
}: {
  src?: string | null;
  title: string;
  alt?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn('overflow-hidden bg-muted', className)} data-title={title}>
      {src && !failed ? (
        // Plain images support administrator-provided URLs without a host allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={1200}
          height={675}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full min-h-32 items-center justify-center bg-accent text-accent-foreground">
          <BookOpen className="size-10 opacity-70" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
