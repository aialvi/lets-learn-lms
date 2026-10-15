'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { control, Course, CourseLesson, panel, Question } from '@/lib/organizations';
export function CourseEditor({ initial, enabled, save, cancel }: { initial?: Course; enabled: string[]; save: (body: unknown, id?: string) => Promise<void>; cancel: () => void }) {
  const [title, setTitle] = useState(initial?.title || ''); const [description, setDescription] = useState(initial?.description || '');
  const [lessons, setLessons] = useState<CourseLesson[]>(initial?.lessons || [{ title: '', content: '' }]);
  const [questions, setQuestions] = useState<Question[]>(initial?.quiz?.questions || []);
  const [pass, setPass] = useState(initial?.quiz?.passPercent || 80); const [limit, setLimit] = useState(initial?.quiz?.maxAttempts?.toString() || '');
  const [certify, setCertify] = useState(initial?.certificationEnabled || false); const [months, setMonths] = useState(initial ? initial.validityMonths?.toString() || '' : '12'); const [renewal, setRenewal] = useState(initial?.renewalMode || 'full');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const lesson = (index: number, change: Partial<CourseLesson>) => setLessons(rows => rows.map((row, i) => i === index ? { ...row, ...change } : row));
  const question = (index: number, change: Partial<Question>) => setQuestions(rows => rows.map((row, i) => i === index ? { ...row, ...change } : row));
  return <form className={panel} onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try { await save({ title, description, lessons: lessons.map(l => ({ ...l, videoUrl: l.videoUrl || undefined })), quiz: questions.length ? { questions, passPercent: pass, maxAttempts: limit ? Number(limit) : null } : null, certificationEnabled: certify, validityMonths: certify && months ? Number(months) : null, renewalMode: renewal }, initial?.id); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>
    <h2 className="text-xl font-semibold">{initial ? 'Edit course' : 'Create course'}</h2><p className="text-sm text-muted-foreground">Changes apply to new assignments. Active training and renewal requirements keep their published version.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <label className="block">Course title<input className={control} value={title} onChange={e => setTitle(e.target.value)} required maxLength={200} /></label>
    <label className="block">Description<textarea className={control} value={description} onChange={e => setDescription(e.target.value)} rows={3} /></label>
    <h3 className="font-semibold">Lessons</h3>
    {lessons.map((row, i) => <fieldset key={i} className="space-y-3 rounded-lg border p-4"><legend className="px-2 text-sm">Lesson {i + 1}</legend>
      <label className="block">Title<input className={control} value={row.title} onChange={e => lesson(i, { title: e.target.value })} required /></label>
      <label className="block">Lesson content<textarea className={control} value={row.content || ''} onChange={e => lesson(i, { content: e.target.value })} rows={4} /></label>
      <label className="block">Video URL (optional)<input className={control} type="url" value={row.videoUrl || ''} onChange={e => lesson(i, { videoUrl: e.target.value })} /></label>
      <Button type="button" variant="outline" disabled={lessons.length === 1} onClick={() => setLessons(lessons.filter((_, index) => index !== i))}>Remove lesson {i + 1}</Button>
    </fieldset>)}<Button type="button" variant="outline" onClick={() => setLessons([...lessons, { title: '', content: '' }])}>Add lesson</Button>
    {enabled.includes('assessments') && <section className="space-y-4 border-t pt-4"><h3 className="font-semibold">Course quiz</h3>
      {questions.map((row, i) => <fieldset key={i} className="space-y-3 rounded-lg border p-4"><legend className="px-2 text-sm">Question {i + 1}</legend>
        <label className="block">Type<select className={control} value={row.type} onChange={e => question(i, { type: e.target.value, options: e.target.value === 'boolean' ? ['True', 'False'] : ['', '', '', ''], correctIndex: 0 })}><option value="choice">Multiple choice</option><option value="boolean">True / false</option></select></label>
        <label className="block">Question<input className={control} value={row.prompt} required onChange={e => question(i, { prompt: e.target.value })} /></label>
        {row.options.map((option, j) => <label key={j} className="flex items-center gap-3"><input type="radio" name={`correct-${i}`} checked={row.correctIndex === j} onChange={() => question(i, { correctIndex: j })} aria-label={`Correct answer: option ${j + 1} for question ${i + 1}`} /><span className="sr-only">Option {j + 1}</span><input className={control} required readOnly={row.type === 'boolean'} value={option} onChange={e => question(i, { options: row.options.map((v, index) => index === j ? e.target.value : v) })} /></label>)}
        <p className="text-xs text-muted-foreground">Select the radio button beside the correct answer.</p><Button type="button" variant="outline" onClick={() => setQuestions(questions.filter((_, index) => index !== i))}>Remove question {i + 1}</Button>
      </fieldset>)}
      <Button type="button" variant="outline" onClick={() => setQuestions([...questions, { type: 'choice', prompt: '', options: ['', '', '', ''], correctIndex: 0 }])}>Add question</Button>
      {questions.length > 0 && <div className="grid gap-4 sm:grid-cols-2"><label>Pass threshold (%)<input className={control} type="number" min={1} max={100} value={pass} onChange={e => setPass(Number(e.target.value))} required /></label><label>Attempt limit (blank = unlimited)<input className={control} type="number" min={1} max={100} value={limit} onChange={e => setLimit(e.target.value)} /></label></div>}
    </section>}
    {enabled.includes('certifications') && <section className="space-y-4 border-t pt-4"><label className="flex gap-2 items-center"><input type="checkbox" checked={certify} onChange={e => setCertify(e.target.checked)} />Issue a completion certificate</label>{certify && <div className="grid gap-4 sm:grid-cols-2"><label>Validity in months (blank = no expiry)<input className={control} type="number" min={1} max={120} value={months} onChange={e => setMonths(e.target.value)} /></label><label>Renewal requirements<select className={control} value={renewal} onChange={e => setRenewal(e.target.value)}><option value="full">Repeat lessons and pass quiz</option><option value="quiz">Pass quiz only</option></select></label><p className="text-sm text-muted-foreground sm:col-span-2">Expiring certificates require a quiz. Renewal training opens 30 days before expiry.</p></div>}</section>}
    <div className="flex gap-3"><Button disabled={busy}>{busy ? 'Saving…' : 'Save course'}</Button><Button type="button" variant="outline" onClick={cancel}>Cancel</Button></div>
  </form>;
}
