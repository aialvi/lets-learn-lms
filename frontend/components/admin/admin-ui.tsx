'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LoadingRegion, Skeleton } from '@/components/ui/skeleton';

/** Turns an API/axios error into a sentence a person can act on. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (!error.response) return `${fallback} The server didn't respond — check your connection and try again.`;
    const message = (error.response.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(message) && message.length) return message.join('. ');
    if (typeof message === 'string' && message) return message;
    if (error.response.status === 403) return "You don't have permission to do that.";
    if (error.response.status >= 500) return `${fallback} The server hit an error — try again in a moment.`;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className='page-header mb-6'>
      <div className='space-y-1.5'>
        {eyebrow ? <p className='eyebrow'>{eyebrow}</p> : null}
        <h1 className='page-title'>{title}</h1>
        {description ? <p className='page-description'>{description}</p> : null}
      </div>
      {action ? <div className='flex shrink-0 items-center gap-2'>{action}</div> : null}
    </div>
  );
}

export function TableSkeleton({ label, columns, rows = 6 }: { label: string; columns: number; rows?: number }) {
  return (
    <LoadingRegion label={label} className='surface overflow-hidden'>
      <div className='flex gap-4 border-b bg-muted/40 px-4 py-3'>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className='h-4 flex-1' />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className='flex items-center gap-4 border-b px-4 py-4 last:border-0'>
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={c === 0 ? 'h-4 w-10 flex-none' : 'h-4 flex-1'} />
          ))}
        </div>
      ))}
    </LoadingRegion>
  );
}

/**
 * Edit + delete controls for a table row. Icon buttons carry accessible names
 * that include the row's label, and deletion always asks for confirmation.
 */
export function RowActions({
  itemType,
  itemLabel,
  onEdit,
  onDelete,
  deleteDescription,
}: {
  itemType: string;
  itemLabel: string;
  onEdit: () => void;
  onDelete: () => Promise<void> | void;
  deleteDescription: string;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className='flex items-center justify-end gap-1'>
      <Button
        variant='ghost'
        size='icon-sm'
        onClick={onEdit}
        aria-label={`Edit ${itemType} ${itemLabel}`}
        title={`Edit ${itemType}`}
      >
        <Pencil aria-hidden='true' />
      </Button>
      <AlertDialog open={open} onOpenChange={(next) => !deleting && setOpen(next)}>
        <AlertDialogTrigger asChild>
          <Button
            variant='ghost'
            size='icon-sm'
            className='text-destructive hover:bg-destructive-soft hover:text-destructive'
            aria-label={`Delete ${itemType} ${itemLabel}`}
            title={`Delete ${itemType}`}
          >
            <Trash2 aria-hidden='true' />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {itemType} “{itemLabel}”?
            </AlertDialogTitle>
            <AlertDialogDescription>{deleteDescription} This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              disabled={deleting}
              onClick={async (event) => {
                event.preventDefault();
                setDeleting(true);
                try {
                  await onDelete();
                } finally {
                  setDeleting(false);
                  setOpen(false);
                }
              }}
            >
              {deleting ? <Spinner /> : null}
              {deleting ? 'Deleting…' : `Delete ${itemType}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Wraps a data table in a bordered surface; the Table primitive already scrolls horizontally. */
export function TableSurface({ children }: { children: React.ReactNode }) {
  return <div className='surface overflow-hidden [&_td]:px-4 [&_td]:py-3 [&_th]:h-11 [&_th]:px-4'>{children}</div>;
}

type FieldControlProps = {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
};

/** Label + control + hint + error, with ARIA wiring handled for the control. */
export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: (props: FieldControlProps) => React.ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className ?? 'space-y-2'}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {hint ? (
        <p id={hintId} className='text-sm text-muted-foreground'>
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

/** Form-level error, e.g. when the server rejects a submission. */
export { FormAlert } from '@/components/ui/form-alert';
