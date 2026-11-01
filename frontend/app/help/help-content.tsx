'use client';

import { useId, useMemo, useState } from 'react';
import { ChevronDown, Search, SearchX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export interface Faq {
  question: string;
  answer: string;
}

/** Searchable FAQ list. Uses native <details> so it works with keyboard and AT out of the box. */
export function HelpContent({ faqs }: { faqs: Faq[] }) {
  const [query, setQuery] = useState('');
  const searchId = useId();
  const q = query.trim().toLowerCase();
  const results = useMemo(
    () => (q ? faqs.filter((f) => `${f.question} ${f.answer}`.toLowerCase().includes(q)) : faqs),
    [faqs, q]
  );

  return (
    <section id='faq' aria-labelledby='faq-heading' className='scroll-mt-24'>
      <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <h2 id='faq-heading' className='text-2xl font-semibold tracking-tight text-foreground'>
          Frequently asked questions
        </h2>
        <div className='w-full sm:max-w-xs'>
          <label htmlFor={searchId} className='sr-only'>
            Search frequently asked questions
          </label>
          <div className='relative'>
            <Search
              aria-hidden='true'
              className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              id={searchId}
              type='search'
              placeholder='Search questions'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='pl-9'
            />
          </div>
        </div>
      </div>

      <p aria-live='polite' className='sr-only'>
        {q ? `${results.length} ${results.length === 1 ? 'question matches' : 'questions match'} your search` : ''}
      </p>

      {results.length > 0 ? (
        <div className='divide-y overflow-hidden rounded-xl border bg-card'>
          {results.map((faq) => (
            <details key={faq.question} className='group'>
              <summary className='flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-foreground transition-colors hover:bg-muted focus-visible:-outline-offset-2 [&::-webkit-details-marker]:hidden'>
                {faq.question}
                <ChevronDown
                  aria-hidden='true'
                  className='size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180'
                />
              </summary>
              <p className='px-5 pb-5 text-sm leading-6 text-muted-foreground'>{faq.answer}</p>
            </details>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          title={`No questions match “${query.trim()}”`}
          description='Try a different word, or contact our support team and we’ll answer directly.'
          action={
            <Button type='button' variant='outline' onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      )}
    </section>
  );
}
