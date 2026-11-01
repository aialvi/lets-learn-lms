'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Mail, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { FormAlert } from '@/components/ui/form-alert';
import {
  check,
  control,
  Delivery,
  fieldLabel,
  moduleNames,
  modules,
  Organization,
  panel,
} from '@/lib/organizations';

const deliveryVariant: Record<string, BadgeProps['variant']> = {
  // Values written by backend/src/organizations/notifications.service.ts
  sent: 'success',
  pending: 'info',
  sending: 'info',
  failed: 'destructive',
  cancelled: 'secondary',
  disabled: 'secondary',
};

export function SettingsPanel({
  organization,
  deliveries,
  act,
}: {
  organization: Organization;
  deliveries: Delivery[];
  act: (path: string, body: unknown, method?: string) => Promise<unknown>;
}) {
  const [enabled, setEnabled] = useState(organization.modules);
  const [mode, setMode] = useState(organization.mode);
  const [busy, setBusy] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [error, setError] = useState('');

  return (
    <div className='space-y-6'>
      <FormAlert message={error || null} />

      <form
        className={panel}
        aria-labelledby='settings-heading'
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setBusy(true);
          setError('');
          try {
            await act('', { name: data.get('name'), timezone: data.get('timezone'), mode, modules: enabled }, 'PATCH');
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 id='settings-heading' className='text-lg font-semibold'>
          Workspace settings
        </h2>
        <div className='grid gap-4 sm:grid-cols-2'>
          <label className={fieldLabel}>
            Name
            <input className={control} name='name' required defaultValue={organization.name} />
          </label>
          <label className={fieldLabel}>
            Timezone
            <input className={control} name='timezone' required defaultValue={organization.timezone} />
          </label>
        </div>
        <label className={`${fieldLabel} sm:max-w-xs`}>
          Learning mode
          <select
            className={control}
            value={mode}
            aria-describedby='mode-hint'
            onChange={(e) => {
              setMode(e.target.value);
              setEnabled(e.target.value === 'professional' ? [...modules] : ['certifications']);
            }}
          >
            <option value='academic'>Academic</option>
            <option value='professional'>Professional</option>
          </select>
        </label>
        <p id='mode-hint' className='-mt-2 text-sm text-muted-foreground'>
          Changing the mode resets modules to that mode&apos;s defaults.
        </p>
        <fieldset className='space-y-3' aria-describedby='modules-hint'>
          <legend className='font-semibold'>Modules</legend>
          <p id='modules-hint' className='text-sm text-muted-foreground'>
            Courses and the AI coach are always available. Reports require Teams &amp; training. Complete or cancel
            dependent training before disabling a module.
          </p>
          <div className='grid gap-2 sm:grid-cols-2'>
            {modules.map((module) => (
              <label
                key={module}
                className='flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50 has-[:checked]:border-primary/60 has-[:checked]:bg-accent/60'
              >
                <input
                  className={check}
                  type='checkbox'
                  checked={enabled.includes(module)}
                  onChange={(e) =>
                    setEnabled(e.target.checked ? [...enabled, module] : enabled.filter((m) => m !== module))
                  }
                />
                {moduleNames[module]}
              </label>
            ))}
          </div>
        </fieldset>
        <Button disabled={busy}>
          {busy ? <Spinner /> : null}
          {busy ? 'Saving…' : 'Save settings'}
        </Button>
      </form>

      <section className={panel} aria-labelledby='email-heading'>
        <h2 id='email-heading' className='text-lg font-semibold'>
          Email delivery
        </h2>
        {organization.email?.configured ? (
          <Alert variant='success'>
            <CheckCircle2 aria-hidden='true' />
            <AlertDescription>Email delivery is enabled. Failed messages are retried automatically.</AlertDescription>
          </Alert>
        ) : (
          <Alert variant='warning'>
            <AlertCircle aria-hidden='true' />
            <AlertDescription>
              Email delivery isn&apos;t configured. In-app reminders and shareable invitation links still work.
              Configure SMTP on the server to enable email.
            </AlertDescription>
          </Alert>
        )}

        {deliveries.length === 0 ? (
          <EmptyState
            size='sm'
            icon={Mail}
            title='No email messages yet'
            description='Invitations and reminders sent by email will be listed here with their delivery status.'
          />
        ) : (
          <div className='-mx-5 overflow-x-auto sm:-mx-6'>
            <table className='w-full text-left text-sm'>
              <caption className='sr-only'>Email delivery log</caption>
              <thead className='border-y bg-muted/40 text-muted-foreground'>
                <tr>
                  <th scope='col' className='px-4 py-2.5 pl-5 font-medium sm:pl-6'>
                    Recipient / message
                  </th>
                  <th scope='col' className='px-4 py-2.5 font-medium'>
                    Status
                  </th>
                  <th scope='col' className='px-4 py-2.5 pr-5 text-right font-medium sm:pr-6'>
                    Attempts
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className='align-top'>
                    <td className='px-4 py-3 pl-5 sm:pl-6'>
                      <p className='font-medium'>{delivery.recipient}</p>
                      <p className='text-muted-foreground'>{delivery.subject}</p>
                      {delivery.lastError && <p className='mt-1 text-destructive'>{delivery.lastError}</p>}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Badge variant={deliveryVariant[delivery.emailStatus] ?? 'secondary'} className='capitalize'>
                          {delivery.emailStatus}
                        </Badge>
                        {delivery.emailStatus === 'failed' && (
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={busy || retrying !== null}
                            aria-label={`Retry email to ${delivery.recipient}`}
                            onClick={async () => {
                              setRetrying(delivery.id);
                              setError('');
                              try {
                                await act(`/deliveries/${delivery.id}/retry`, {});
                              } catch (e) {
                                setError((e as Error).message);
                              } finally {
                                setRetrying(null);
                              }
                            }}
                          >
                            {retrying === delivery.id ? <Spinner /> : <RotateCcw aria-hidden='true' />}
                            Retry
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-3 pr-5 text-right tabular-nums sm:pr-6'>{delivery.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
