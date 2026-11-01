'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FormAlert } from '@/components/ui/form-alert';
import { check, control, Course, CourseLesson, fieldLabel, panel, Question } from '@/lib/organizations';

const optional = <span className='font-normal text-muted-foreground'>(optional)</span>;

export function CourseEditor({
  initial,
  enabled,
  save,
  cancel,
}: {
  initial?: Course;
  enabled: string[];
  save: (body: unknown, id?: string) => Promise<void>;
  cancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [lessons, setLessons] = useState<CourseLesson[]>(initial?.lessons || [{ title: '', content: '' }]);
  const [questions, setQuestions] = useState<Question[]>(initial?.quiz?.questions || []);
  const [pass, setPass] = useState(initial?.quiz?.passPercent || 80);
  const [limit, setLimit] = useState(initial?.quiz?.maxAttempts?.toString() || '');
  const [certify, setCertify] = useState(initial?.certificationEnabled || false);
  const [months, setMonths] = useState(initial ? initial.validityMonths?.toString() || '' : '12');
  const [renewal, setRenewal] = useState(initial?.renewalMode || 'full');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const lesson = (index: number, change: Partial<CourseLesson>) =>
    setLessons((rows) => rows.map((row, i) => (i === index ? { ...row, ...change } : row)));
  const question = (index: number, change: Partial<Question>) =>
    setQuestions((rows) => rows.map((row, i) => (i === index ? { ...row, ...change } : row)));

  return (
    <form
      className={panel}
      aria-labelledby='course-editor-heading'
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
          await save(
            {
              title,
              description,
              lessons: lessons.map((l) => ({ ...l, videoUrl: l.videoUrl || undefined })),
              quiz: questions.length ? { questions, passPercent: pass, maxAttempts: limit ? Number(limit) : null } : null,
              certificationEnabled: certify,
              validityMonths: certify && months ? Number(months) : null,
              renewalMode: renewal,
            },
            initial?.id
          );
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className='space-y-1 border-b pb-4'>
        <h2 id='course-editor-heading' className='text-xl font-semibold tracking-tight'>
          {initial ? `Edit course: ${initial.title}` : 'Create course'}
        </h2>
        <p className='text-sm text-muted-foreground'>
          Changes apply to new assignments. Active training and renewal requirements keep their published version.
        </p>
      </div>

      <FormAlert message={error || null} />

      <section className='space-y-4' aria-labelledby='course-details-heading'>
        <h3 id='course-details-heading' className='font-semibold'>
          Details
        </h3>
        <label className={fieldLabel}>
          Course title
          <input className={control} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        </label>
        <label className={fieldLabel}>
          Description {optional}
          <textarea className={control} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>
      </section>

      <section className='space-y-4 border-t pt-5' aria-labelledby='course-lessons-heading'>
        <h3 id='course-lessons-heading' className='font-semibold'>
          Lessons
        </h3>
        {lessons.map((row, i) => (
          <fieldset key={i} className='space-y-4 rounded-lg border p-4'>
            <legend className='px-1 text-sm font-medium'>Lesson {i + 1}</legend>
            <label className={fieldLabel}>
              Title
              <input className={control} value={row.title} onChange={(e) => lesson(i, { title: e.target.value })} required />
            </label>
            <label className={fieldLabel}>
              Lesson content
              <textarea
                className={control}
                value={row.content || ''}
                onChange={(e) => lesson(i, { content: e.target.value })}
                rows={4}
              />
            </label>
            <label className={fieldLabel}>
              Video URL {optional}
              <input
                className={control}
                type='url'
                placeholder='https://'
                value={row.videoUrl || ''}
                onChange={(e) => lesson(i, { videoUrl: e.target.value })}
              />
            </label>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='text-destructive hover:bg-destructive-soft hover:text-destructive'
              disabled={lessons.length === 1}
              onClick={() => setLessons(lessons.filter((_, index) => index !== i))}
            >
              <Trash2 aria-hidden='true' />
              Remove lesson {i + 1}
            </Button>
          </fieldset>
        ))}
        <Button type='button' variant='outline' onClick={() => setLessons([...lessons, { title: '', content: '' }])}>
          <Plus aria-hidden='true' />
          Add lesson
        </Button>
      </section>

      {enabled.includes('assessments') && (
        <section className='space-y-4 border-t pt-5' aria-labelledby='course-quiz-heading'>
          <div className='space-y-1'>
            <h3 id='course-quiz-heading' className='font-semibold'>
              Course quiz
            </h3>
            <p className='text-sm text-muted-foreground'>
              {questions.length ? 'Select the radio button beside each correct answer.' : 'Optional. Add questions to require a passing score.'}
            </p>
          </div>
          {questions.map((row, i) => (
            <fieldset key={i} className='space-y-4 rounded-lg border p-4'>
              <legend className='px-1 text-sm font-medium'>Question {i + 1}</legend>
              <div className='grid gap-4 sm:grid-cols-[12rem_1fr]'>
                <label className={fieldLabel}>
                  Type
                  <select
                    className={control}
                    value={row.type}
                    onChange={(e) =>
                      question(i, {
                        type: e.target.value,
                        options: e.target.value === 'boolean' ? ['True', 'False'] : ['', '', '', ''],
                        correctIndex: 0,
                      })
                    }
                  >
                    <option value='choice'>Multiple choice</option>
                    <option value='boolean'>True / false</option>
                  </select>
                </label>
                <label className={fieldLabel}>
                  Question
                  <input className={control} value={row.prompt} required onChange={(e) => question(i, { prompt: e.target.value })} />
                </label>
              </div>
              <fieldset className='space-y-2'>
                <legend className='mb-1 text-sm font-medium'>Answers</legend>
                {row.options.map((option, j) => (
                  <div key={j} className='flex items-center gap-3'>
                    <input
                      className={check}
                      type='radio'
                      name={`correct-${i}`}
                      checked={row.correctIndex === j}
                      onChange={() => question(i, { correctIndex: j })}
                      aria-label={`Mark option ${j + 1} as the correct answer for question ${i + 1}`}
                    />
                    <input
                      className={`${control} mt-0`}
                      aria-label={`Question ${i + 1}, option ${j + 1}`}
                      required
                      readOnly={row.type === 'boolean'}
                      value={option}
                      onChange={(e) =>
                        question(i, { options: row.options.map((v, index) => (index === j ? e.target.value : v)) })
                      }
                    />
                  </div>
                ))}
              </fieldset>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='text-destructive hover:bg-destructive-soft hover:text-destructive'
                onClick={() => setQuestions(questions.filter((_, index) => index !== i))}
              >
                <Trash2 aria-hidden='true' />
                Remove question {i + 1}
              </Button>
            </fieldset>
          ))}
          <Button
            type='button'
            variant='outline'
            onClick={() =>
              setQuestions([...questions, { type: 'choice', prompt: '', options: ['', '', '', ''], correctIndex: 0 }])
            }
          >
            <Plus aria-hidden='true' />
            Add question
          </Button>
          {questions.length > 0 && (
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className={fieldLabel}>
                Pass threshold (%)
                <input
                  className={control}
                  type='number'
                  min={1}
                  max={100}
                  value={pass}
                  onChange={(e) => setPass(Number(e.target.value))}
                  required
                />
              </label>
              <label className={fieldLabel}>
                Attempt limit <span className='font-normal text-muted-foreground'>(blank = unlimited)</span>
                <input
                  className={control}
                  type='number'
                  min={1}
                  max={100}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </label>
            </div>
          )}
        </section>
      )}

      {enabled.includes('certifications') && (
        <section className='space-y-4 border-t pt-5' aria-labelledby='course-cert-heading'>
          <h3 id='course-cert-heading' className='font-semibold'>
            Certification
          </h3>
          <label className='flex items-center gap-3 text-sm'>
            <input className={check} type='checkbox' checked={certify} onChange={(e) => setCertify(e.target.checked)} />
            Issue a completion certificate
          </label>
          {certify && (
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className={fieldLabel}>
                Validity in months <span className='font-normal text-muted-foreground'>(blank = no expiry)</span>
                <input
                  className={control}
                  type='number'
                  min={1}
                  max={120}
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                />
              </label>
              <label className={fieldLabel}>
                Renewal requirements
                <select className={control} value={renewal} onChange={(e) => setRenewal(e.target.value)}>
                  <option value='full'>Repeat lessons and pass quiz</option>
                  <option value='quiz'>Pass quiz only</option>
                </select>
              </label>
              <p className='text-sm text-muted-foreground sm:col-span-2'>
                Expiring certificates require a quiz. Renewal training opens 30 days before expiry.
              </p>
            </div>
          )}
        </section>
      )}

      <div className='flex flex-wrap gap-2 border-t pt-5'>
        <Button disabled={busy}>
          {busy ? <Spinner /> : null}
          {busy ? 'Saving…' : 'Save course'}
        </Button>
        <Button type='button' variant='outline' onClick={cancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
