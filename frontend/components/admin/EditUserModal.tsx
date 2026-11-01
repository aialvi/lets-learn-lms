'use client';

import { useEffect, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, FormAlert } from './admin-ui';
import { User, UpdateUserData } from '@/types';

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateUserData) => Promise<void>;
}

export function EditUserModal({ user, isOpen, onClose, onSubmit }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user]);

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
    // Password can be empty for update
    if (formData.password && formData.password.length < 6) newErrors.password = 'Use at least 6 characters.';
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const firstInvalid = Object.keys(validateForm())[0];
    if (firstInvalid) {
      e.currentTarget.querySelector<HTMLElement>(`#edit-user-${firstInvalid}`)?.focus();
      return;
    }
    try {
      setIsSubmitting(true);
      // Don't send empty password
      let dataToSubmit: UpdateUserData;
      if (!formData.password) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...dataWithoutPassword } = formData;
        dataToSubmit = dataWithoutPassword;
      } else {
        dataToSubmit = formData;
      }
      await onSubmit(dataToSubmit);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We couldn't save changes to this user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>Update {user.username}&apos;s details, role, and access.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className='space-y-4'>
          <FormAlert message={submitError} />
          <Field id='edit-user-username' label='Username' error={errors.username}>
            {(props) => <Input {...props} name='username' value={formData.username} onChange={handleChange} />}
          </Field>
          <Field id='edit-user-email' label='Email' error={errors.email}>
            {(props) => <Input {...props} name='email' type='email' value={formData.email} onChange={handleChange} />}
          </Field>
          <Field
            id='edit-user-password'
            label='New password'
            hint='Leave blank to keep the current password.'
            error={errors.password}
          >
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
          <Field id='edit-user-role' label='Role'>
            {(props) => (
              <Select value={formData.role} onValueChange={(role) => setFormData((prev) => ({ ...prev, role }))}>
                <SelectTrigger {...props} className='w-full'>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='user'>User</SelectItem>
                  <SelectItem value='instructor'>Instructor</SelectItem>
                  <SelectItem value='admin'>Admin</SelectItem>
                </SelectContent>
              </Select>
            )}
          </Field>
          <div className='flex items-start gap-3 rounded-lg border p-4'>
            <Checkbox
              id='edit-user-active'
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked === true }))}
              aria-describedby='edit-user-active-hint'
            />
            <div className='space-y-1'>
              <Label htmlFor='edit-user-active'>Active account</Label>
              <p id='edit-user-active-hint' className='text-sm text-muted-foreground'>
                Inactive users can&apos;t sign in.
              </p>
            </div>
          </div>

          <DialogFooter className='pt-2'>
            <Button type='button' variant='outline' onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : null}
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
