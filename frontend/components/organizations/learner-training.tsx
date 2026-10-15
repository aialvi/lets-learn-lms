'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cycle, displayDate, panel } from '@/lib/organizations';
export function LearnerTraining({ cycles, timezone, act }: { cycles: Cycle[]; timezone: string; act: (path: string, body?: unknown) => Promise<void> }) {
  const [selected, setSelected] = useState(''); const [answers, setAnswers] = useState<Record<string, number[]>>({}); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const run = async (path: string, body?: unknown) => { setBusy(true); setError(''); try { await act(path, body); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
  const current = cycles.find(c => c.id === selected);
  return <div className="space-y-5">{error && <p role="alert" className="text-destructive">{error}</p>}
    {cycles.length > 0 && <section className="rounded-xl bg-primary text-primary-foreground p-6 md:p-8"><div className="flex flex-wrap justify-between gap-5"><div><p className="text-sm opacity-80">A little progress, every day</p><h2 className="mt-2 text-2xl font-semibold">Build skills. Stay ready.</h2><p className="mt-2 text-sm opacity-80">Your assigned learning, renewal deadlines, and achievements in one place.</p></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-7">{[
      ['Active courses', cycles.filter(c => !c.completedAt && !c.assignment.cancelledAt).length],
      ['Completed cycles', cycles.filter(c => c.completedAt).length],
      ['Due this week', cycles.filter(c => !c.completedAt && !c.assignment.cancelledAt && c.dueAt && new Date(c.dueAt).getTime() <= Date.now() + 7 * 86400000).length],
      ['Certificates earned', cycles.filter(c => c.certificate).length],
    ].map(([label, count]) => <div key={label} className="border-t border-white/25 pt-3"><p className="text-3xl font-semibold">{count}</p><p className="mt-1 text-sm opacity-80">{label}</p></div>)}</div></section>}
    {!cycles.length && <div className={panel}><h2 className="font-semibold">Your next learning step</h2><p className="text-muted-foreground">Enroll in a course from the catalog, or wait for your manager to assign training.</p></div>}
    <div className="grid gap-4 md:grid-cols-2">{cycles.map(cycle => <button key={cycle.id} type="button" onClick={() => { setSelected(cycle.id); setError(''); }} className={`${panel} text-left transition-colors ${selected === cycle.id ? 'border-primary' : 'hover:border-primary/50'}`}>
      <div className="flex justify-between gap-3"><h2 className="font-semibold">{cycle.snapshot.title}</h2><span className="text-xs rounded-full bg-muted px-2 py-1 whitespace-nowrap">Cycle {cycle.sequence}</span></div>
      <p className="text-sm text-muted-foreground">{cycle.assignment.cancelledAt ? 'Cancelled' : cycle.completedAt ? 'Completed' : cycle.dueAt && new Date(cycle.dueAt) < new Date() ? 'Overdue' : 'In progress'} · {cycle.mode === 'quiz' ? 'Quiz-only renewal' : `${cycle.completedLessons.length}/${cycle.snapshot.lessons.length} lessons`}</p>
      <p className="text-sm">Due {displayDate(cycle.dueAt, timezone)}</p>
    </button>)}</div>
    {current && <section className={panel}><div><h2 className="text-2xl font-semibold">{current.snapshot.title}</h2><p className="mt-2 text-muted-foreground">{current.snapshot.description}</p></div>
      {current.assignment.cancelledAt ? <p>This training assignment has been cancelled.</p> : current.completedAt ? <p role="status" className="font-medium text-primary">Completed {displayDate(current.completedAt, timezone)}. {current.certificate ? 'Your certificate is available in Certifications.' : ''}</p> : <>
        {current.mode !== 'quiz' && current.snapshot.lessons.map((lesson, i) => <details key={lesson.id} className="rounded-lg border p-4" open={i === 0}><summary className="cursor-pointer font-medium">{current.completedLessons.includes(lesson.id!) ? '✓ ' : ''}{i + 1}. {lesson.title}</summary><div className="mt-4 space-y-4"><p className="whitespace-pre-wrap">{lesson.content}</p>{lesson.videoUrl && <a className="text-primary underline" href={lesson.videoUrl} target="_blank" rel="noopener noreferrer">Watch lesson video</a>}<Button disabled={busy || current.completedLessons.includes(lesson.id!)} onClick={() => void run(`/training/${current.id}/lessons`, { lessonId: lesson.id })}>{current.completedLessons.includes(lesson.id!) ? 'Lesson completed' : 'Mark lesson complete'}</Button></div></details>)}
        {current.snapshot.quiz && <form className="space-y-4 border-t pt-5" onSubmit={event => { event.preventDefault(); void run(`/training/${current.id}/attempts`, { answers: answers[current.id] || [] }); }}>
          <h3 className="text-lg font-semibold">Knowledge check</h3><p className="text-sm text-muted-foreground">Pass at {current.snapshot.quiz.passPercent}%. {current.snapshot.quiz.maxAttempts ? `${current.attempts.length}/${current.snapshot.quiz.maxAttempts} attempts used.` : 'Unlimited attempts.'}</p>
          {current.snapshot.quiz.questions.map((question, i) => <fieldset key={i} className="space-y-2"><legend className="mb-2 font-medium">{i + 1}. {question.prompt}</legend>{question.options.map((option, j) => <label key={j} className="flex items-center gap-3 rounded-md border p-3"><input type="radio" name={`${current.id}-${i}`} required checked={answers[current.id]?.[i] === j} onChange={() => setAnswers(previous => { const next = [...(previous[current.id] || [])]; next[i] = j; return { ...previous, [current.id]: next }; })} />{option}</label>)}</fieldset>)}
          <Button disabled={busy || current.mode !== 'quiz' && current.completedLessons.length < current.snapshot.lessons.length || !!current.snapshot.quiz.maxAttempts && current.attempts.length >= current.snapshot.quiz.maxAttempts}>Submit quiz</Button>
          {current.mode !== 'quiz' && current.completedLessons.length < current.snapshot.lessons.length && <p className="text-sm text-muted-foreground">Complete all lessons before submitting.</p>}
        </form>}
      </>}
      {current.attempts.length > 0 && <div className="space-y-2"><h3 className="font-medium">Attempt history</h3>{current.attempts.map((attempt, i) => <p key={attempt.id} className="text-sm">Attempt {current.attempts.length - i}: {Math.round(attempt.score)}% · {attempt.passed ? 'Passed' : 'Try again'}</p>)}</div>}
    </section>}
  </div>;
}
