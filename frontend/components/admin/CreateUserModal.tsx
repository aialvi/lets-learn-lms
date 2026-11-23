'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { SelectField } from '@/components/ui/select-field';
import { Field, FormAlert, userRoles } from './admin-ui';
import { CreateUserData } from '@/types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserData) => Promise<void>;
}

const emptyForm = { username: '', email: '', password: '', role: 'student' };

export function CreateUserModal({ isOpen, onClose, onSubmit }: CreateUserModalProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = 'Enter a username.';
    if (!formData.email.trim()) newErrors.email = 'Enter an email address.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Enter an email address like name@example.com.';
    if (!formData.password.trim()) newErrors.password = 'Enter a password.';
    else if (formData.password.length < 6) newErrors.password = 'Use at least 6 characters.';
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const newErrors = validateForm();
    const firstInvalid = Object.keys(newErrors)[0];
    if (firstInvalid) {
      e.currentTarget.querySelector<HTMLElement>(`#create-user-${firstInvalid}`)?.focus();
      return;
    }
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      setFormData(emptyForm);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We couldn't create this user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const close = () => {
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && close()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>They can sign in right away with this email and password.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className='space-y-4'>
          <FormAlert message={submitError} />
          <Field id='create-user-username' label='Username' error={errors.username}>
            {(props) => (
              <Input {...props} name='username' autoComplete='off' value={formData.username} onChange={handleChange} />
            )}
          </Field>
          <Field id='create-user-email' label='Email' error={errors.email}>
            {(props) => (
              <Input {...props} name='email' type='email' autoComplete='off' value={formData.email} onChange={handleChange} />
            )}
          </Field>
          <Field id='create-user-password' label='Password' hint='At least 6 characters.' error={errors.password}>
            {(props) => (
              <Input
                {...props}
                name='password'
                type='password'
                autoComplete='new-password'
                value={formData.password}
                onChange={handleChange}
              />
            )}
          </Field>
          <Field id='create-user-role' label='Role'>
            {(props) => (
              <SelectField
                {...props}
                value={formData.role}
                onValueChange={(role) => setFormData((prev) => ({ ...prev, role }))}
                placeholder='Select role'
                options={userRoles}
              />
            )}
          </Field>

          <DialogFooter className='pt-2'>
            <Button type='button' variant='outline' onClick={close} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : null}
              {isSubmitting ? 'Adding…' : 'Add user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
