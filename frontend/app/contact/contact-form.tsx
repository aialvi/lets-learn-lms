'use client';

import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SUPPORT_EMAIL = 'support@letslearn.com';

type Field = 'firstName' | 'lastName' | 'email' | 'department' | 'subject' | 'message';
type Errors = Partial<Record<Field, string>>;

function validate(data: Record<Field, string>): Errors {
  const errors: Errors = {};
  if (!data.firstName.trim()) errors.firstName = 'Enter your first name.';
  if (!data.email.trim()) errors.email = 'Enter your email address so we can reply.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
    errors.email = 'Enter an email address in the format name@example.com.';
  if (!data.subject.trim()) errors.subject = 'Add a short subject.';
  if (data.message.trim().length < 10) errors.message = 'Describe your question in at least 10 characters.';
  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className='flex items-center gap-1.5 text-sm text-destructive'>
      <AlertCircle aria-hidden='true' className='size-3.5 shrink-0' />
      {message}
    </p>
  );
}

export function ContactForm({ departments }: { departments: { name: string }[] }) {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(
      (['firstName', 'lastName', 'email', 'department', 'subject', 'message'] as Field[]).map((k) => [
        k,
        String(form.get(k) ?? ''),
      ])
    ) as Record<Field, string>;
    const found = validate(data);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      setSent(false);
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const body = [
      `Name: ${data.firstName} ${data.lastName}`.trim(),
      `Email: ${data.email}`,
      data.department ? `Department: ${data.department}` : '',
      '',
      data.message,
    ]
      .filter((line, i) => line !== '' || i === 3)
      .join('\n');
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const fieldProps = (name: Field) => ({
    id: name,
    name,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className='space-y-5'>
      {sent ? (
        <Alert variant='success' role='status'>
          <CheckCircle2 />
          <AlertTitle>Your email app should open now</AlertTitle>
          <AlertDescription>
            Send the drafted message to reach our team. If nothing opened, email us directly at{' '}
            <a className='link' href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      <p className='text-sm text-muted-foreground'>
        Fields marked <span aria-hidden='true'>*</span>
        <span className='sr-only'>with an asterisk</span> are required.
      </p>

      <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='firstName'>
            First name <span aria-hidden='true' className='text-destructive'>*</span>
          </Label>
          <Input {...fieldProps('firstName')} autoComplete='given-name' required />
          <FieldError id='firstName-error' message={errors.firstName} />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='lastName'>Last name</Label>
          <Input {...fieldProps('lastName')} autoComplete='family-name' />
        </div>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='email'>
          Email address <span aria-hidden='true' className='text-destructive'>*</span>
        </Label>
        <Input {...fieldProps('email')} type='email' autoComplete='email' placeholder='you@example.com' required />
        <FieldError id='email-error' message={errors.email} />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='department'>Department</Label>
        <select
          {...fieldProps('department')}
          defaultValue=''
          className='h-10 w-full rounded-md border border-input bg-card px-3 text-base shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 md:text-sm'
        >
          <option value=''>Select a department (optional)</option>
          {departments.map((dept) => (
            <option key={dept.name} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='subject'>
          Subject <span aria-hidden='true' className='text-destructive'>*</span>
        </Label>
        <Input {...fieldProps('subject')} placeholder='How can we help?' required />
        <FieldError id='subject-error' message={errors.subject} />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='message'>
          Message <span aria-hidden='true' className='text-destructive'>*</span>
        </Label>
        <Textarea
          {...fieldProps('message')}
          placeholder='Describe your question or issue in detail…'
          rows={6}
          required
        />
        <FieldError id='message-error' message={errors.message} />
      </div>
      <Button type='submit' className='w-full' size='lg'>
        <Send aria-hidden='true' />
        Send message
      </Button>
    </form>
  );
}
