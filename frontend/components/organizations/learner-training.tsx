'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { FormAlert } from '@/components/ui/form-alert';
import { check, Cycle, displayDate, panel } from '@/lib/organizations';
import { cn } from '@/lib/utils';

function cycleStatus(cycle: Cycle): { label: string; variant: BadgeProps['variant'] } {
  if (cycle.assignment.cancelledAt) return { label: 'Cancelled', variant: 'secondary' };
  if (cycle.completedAt) return { label: 'Completed', variant: 'success' };
  if (cycle.dueAt && new Date(cycle.dueAt) < new Date()) return { label: 'Overdue', variant: 'destructive' };
  return { label: 'In progress', variant: 'info' };
}

export function LearnerTraining({
  cycles,
  timezone,
  act,
  browseCourses,
}: {
  cycles: Cycle[];
  timezone: string;
  act: (path: string, body?: unknown) => Promise<void>;
  /** Optional: switch to the course catalog from the empty state. */
  browseCourses?: () => void;
}) {
  const [selected, setSelected] = useState('');
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const detailRef = useRef<HTMLElement>(null);

  const run = async (path: string, body?: unknown) => {
    setBusy(true);
    setError('');
    try {
      await act(path, body);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const current = cycles.find((c) => c.id === selected);

  // Move focus to the opened course so keyboard and screen reader users land on it.
  useEffect(() => {
    if (selected) detailRef.current?.focus();
  }, [selected]);

  const stats: [string, number][] = [
    ['Active courses', cycles.filter((c) => !c.completedAt && !c.assignment.cancelledAt).length],
    ['Completed cycles', cycles.filter((c) => c.completedAt).length],
    [
      'Due this week',
      cycles.filter(
        (c) =>
          !c.completedAt &&
          !c.assignment.cancelledAt &&
          c.dueAt &&
          new Date(c.dueAt).getTime() <= Date.now() + 7 * 86400000
      ).length,
    ],
    ['Certificates earned', cycles.filter((c) => c.certificate).length],
  ];

  if (!cycles.length) {
    return (
      <div className='space-y-5'>
        <FormAlert message={error || null} />
        <EmptyState
          icon={BookOpen}
          title='Nothing assigned yet'
          description='Enroll in a course from the catalog, or wait for your manager to assign training.'
          action={
            browseCourses ? (
              <Button onClick={browseCourses}>Browse the course catalog</Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <FormAlert message={error || null} />

      <section aria-labelledby='training-summary' className={panel}>
        <div className='space-y-1'>
          <h2 id='training-summary' className='text-lg font-semibold'>
            Build skills. Stay ready.
          </h2>
          <p className='text-sm text-muted-foreground'>
            Your assigned learning, renewal deadlines, and achievements in one place.
          </p>
        </div>
        <dl className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          {stats.map(([label, count]) => (
            <div key={label} className='rounded-lg border bg-muted/40 p-4'>
              <dt className='text-sm text-muted-foreground'>{label}</dt>
              <dd className='mt-1 text-2xl font-semibold tabular-nums'>{count}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby='training-list' className='space-y-3'>
        <h2 id='training-list' className='text-lg font-semibold'>
          Your courses
        </h2>
        <ul className='grid gap-4 md:grid-cols-2'>
          {cycles.map((cycle) => {
            const status = cycleStatus(cycle);
            const lessonTotal = cycle.snapshot.lessons.length;
            const pct = lessonTotal ? Math.round((cycle.completedLessons.length / lessonTotal) * 100) : 0;
            const isSelected = selected === cycle.id;
            return (
              <li key={cycle.id}>
                <button
                  type='button'
                  aria-expanded={isSelected}
                  aria-controls={isSelected ? 'training-detail' : undefined}
                  onClick={() => {
                    setSelected(cycle.id);
                    setError('');
                  }}
                  className={cn(
                    panel,
                    'block h-full w-full text-left transition-colors',
                    isSelected ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'
                  )}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <span className='font-semibold'>{cycle.snapshot.title}</span>
                    <Badge variant='outline' className='shrink-0'>
                      Cycle {cycle.sequence}
                    </Badge>
                  </div>
                  <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <span>
                      {cycle.mode === 'quiz'
                        ? 'Quiz-only renewal'
                        : `${cycle.completedLessons.length}/${lessonTotal} lessons`}
                    </span>
                  </div>
                  {cycle.mode !== 'quiz' && lessonTotal > 0 && (
                    <Progress value={pct} aria-label={`${cycle.snapshot.title} progress`} className='h-1.5' />
                  )}
                  <p className='text-sm text-muted-foreground'>Due {displayDate(cycle.dueAt, timezone)}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {current && (
        <section
          id='training-detail'
          ref={detailRef}
          tabIndex={-1}
          aria-labelledby='training-detail-title'
          className={panel}
        >
          <div className='space-y-2'>
            <h2 id='training-detail-title' className='text-2xl font-semibold tracking-tight'>
              {current.snapshot.title}
            </h2>
            {current.snapshot.description && (
              <p className='leading-7 text-muted-foreground'>{current.snapshot.description}</p>
            )}
          </div>

          {current.assignment.cancelledAt ? (
            <p className='text-muted-foreground'>This training assignment has been cancelled.</p>
          ) : current.completedAt ? (
            <p role='status' className='flex items-center gap-2 font-medium text-success'>
              <CheckCircle2 aria-hidden='true' className='size-5' />
              Completed {displayDate(current.completedAt, timezone)}.{' '}
              {current.certificate ? 'Your certificate is available in Certifications.' : ''}
            </p>
          ) : (
            <>
              {current.mode !== 'quiz' && (
                <ol className='space-y-3'>
                  {current.snapshot.lessons.map((lesson, i) => {
                    const done = current.completedLessons.includes(lesson.id!);
                    return (
                      <li key={lesson.id}>
                        <details className='group rounded-lg border' open={i === 0}>
                          <summary className='flex cursor-pointer items-center gap-3 rounded-lg p-4 font-medium hover:bg-muted/50'>
                            {done ? (
                              <CheckCircle2 aria-hidden='true' className='size-5 shrink-0 text-success' />
                            ) : (
                              <Circle aria-hidden='true' className='size-5 shrink-0 text-muted-foreground' />
                            )}
                            <span>
                              {i + 1}. {lesson.title}
                            </span>
                            {done && <span className='sr-only'>(completed)</span>}
                          </summary>
                          <div className='space-y-4 border-t p-4'>
                            {lesson.content && <p className='whitespace-pre-wrap leading-7'>{lesson.content}</p>}
                            {lesson.videoUrl && (
                              <a
                                className='link inline-flex items-center gap-1.5'
                                href={lesson.videoUrl}
                                target='_blank'
                                rel='noopener noreferrer'
                              >
                                Watch lesson video
                                <ExternalLink aria-hidden='true' className='size-3.5' />
                                <span className='sr-only'>(opens in a new tab)</span>
                              </a>
                            )}
                            <div>
                              <Button
                                variant={done ? 'outline' : 'default'}
                                disabled={busy || done}
                                onClick={() =>
                                  void run(`/training/${current.id}/lessons`, { lessonId: lesson.id })
                                }
                              >
                                {done ? <CheckCircle2 aria-hidden='true' /> : null}
                                {done ? 'Lesson completed' : 'Mark lesson complete'}
                              </Button>
                            </div>
                          </div>
                        </details>
                      </li>
                    );
                  })}
                </ol>
              )}

              {current.snapshot.quiz && (
                <form
                  className='space-y-5 border-t pt-5'
                  aria-labelledby='quiz-heading'
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run(`/training/${current.id}/attempts`, { answers: answers[current.id] || [] });
                  }}
                >
                  <div className='space-y-1'>
                    <h3 id='quiz-heading' className='text-lg font-semibold'>
                      Knowledge check
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      Pass at {current.snapshot.quiz.passPercent}%.{' '}
                      {current.snapshot.quiz.maxAttempts
                        ? `${current.attempts.length}/${current.snapshot.quiz.maxAttempts} attempts used.`
                        : 'Unlimited attempts.'}
                    </p>
                  </div>
                  {current.snapshot.quiz.questions.map((question, i) => (
                    <fieldset key={i} className='space-y-2'>
                      <legend className='mb-2 font-medium'>
                        {i + 1}. {question.prompt}
                      </legend>
                      {question.options.map((option, j) => (
                        <label
                          key={j}
                          className='flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-accent'
                        >
                          <input
                            className={check}
                            type='radio'
                            name={`${current.id}-${i}`}
                            required
                            checked={answers[current.id]?.[i] === j}
                            onChange={() =>
                              setAnswers((previous) => {
                                const next = [...(previous[current.id] || [])];
                                next[i] = j;
                                return { ...previous, [current.id]: next };
                              })
                            }
                          />
                          {option}
                        </label>
                      ))}
                    </fieldset>
                  ))}
                  {current.mode !== 'quiz' && current.completedLessons.length < current.snapshot.lessons.length && (
                    <p id='quiz-locked' className='text-sm text-muted-foreground'>
                      Complete all lessons before submitting.
                    </p>
                  )}
                  <Button
                    aria-describedby={
                      current.mode !== 'quiz' && current.completedLessons.length < current.snapshot.lessons.length
                        ? 'quiz-locked'
                        : undefined
                    }
                    disabled={
                      busy ||
                      (current.mode !== 'quiz' && current.completedLessons.length < current.snapshot.lessons.length) ||
                      (!!current.snapshot.quiz.maxAttempts &&
                        current.attempts.length >= current.snapshot.quiz.maxAttempts)
                    }
                  >
                    {busy ? <Spinner /> : null}
                    Submit quiz
                  </Button>
                </form>
              )}
            </>
          )}

          {current.attempts.length > 0 && (
            <div className='space-y-2 border-t pt-4'>
              <h3 className='font-medium'>Attempt history</h3>
              <ul className='space-y-1.5'>
                {current.attempts.map((attempt, i) => (
                  <li key={attempt.id} className='flex items-center gap-2 text-sm'>
                    <span className='text-muted-foreground'>Attempt {current.attempts.length - i}:</span>
                    <span className='tabular-nums'>{Math.round(attempt.score)}%</span>
                    <Badge variant={attempt.passed ? 'success' : 'warning'}>
                      {attempt.passed ? 'Passed' : 'Not passed — try again'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
