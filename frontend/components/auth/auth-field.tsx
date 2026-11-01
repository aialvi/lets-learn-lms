'use client';

import { forwardRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AuthFieldProps extends InputProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

/**
 * Labelled input with an associated hint and error message. Errors set
 * aria-invalid and are linked via aria-describedby so screen readers read them.
 */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ id, label, error, hint, optional, type, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const isPassword = type === 'password';
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className='space-y-2'>
        <label htmlFor={id} className='flex items-baseline justify-between text-sm font-medium text-foreground'>
          {label}
          {optional ? <span className='text-xs font-normal text-muted-foreground'>Optional</span> : null}
        </label>
        <div className='relative'>
          <Input
            ref={ref}
            id={id}
            type={isPassword && visible ? 'text' : type}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(isPassword && 'pr-11', className)}
            {...props}
          />
          {isPassword ? (
            <button
              type='button'
              onClick={() => setVisible((v) => !v)}
              aria-pressed={visible}
              aria-label={visible ? 'Hide password' : 'Show password'}
              aria-controls={id}
              className='absolute inset-y-0 right-1 my-auto flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              {visible ? <EyeOff aria-hidden='true' className='size-4' /> : <Eye aria-hidden='true' className='size-4' />}
            </button>
          ) : null}
        </div>
        {hint ? (
          <p id={hintId} className='text-xs text-muted-foreground'>
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className='flex items-center gap-1.5 text-sm text-destructive'>
            <AlertCircle aria-hidden='true' className='size-3.5 shrink-0' />
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
AuthField.displayName = 'AuthField';

/** Centered card shell shared by the sign-in and sign-up pages. */
export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('surface w-full max-w-md space-y-6 p-6 shadow-sm sm:p-8', className)}>
      <div className='space-y-2'>
        <p className='eyebrow'>{eyebrow}</p>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>{title}</h1>
        <p className='text-sm leading-6 text-muted-foreground'>{description}</p>
      </div>
      {children}
      <p className='border-t pt-5 text-center text-sm text-muted-foreground'>{footer}</p>
    </div>
  );
}
