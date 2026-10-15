'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';

export function CourseCover({ src, title, className = '' }: { src?: string | null; title: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`overflow-hidden bg-muted ${className}`}>
      {src && !failed ? (
        // Plain images support administrator-provided URLs without a host allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={title} width={1200} height={675} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="flex h-full min-h-32 items-center justify-center bg-accent text-primary"><BookOpen className="size-10" aria-hidden="true" /><span className="sr-only">{title}</span></div>
      )}
    </div>
  );
}
