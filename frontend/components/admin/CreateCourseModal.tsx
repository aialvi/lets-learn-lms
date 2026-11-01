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
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FormAlert } from './admin-ui';
import { CreateCourseData } from '@/types';

interface Instructor {
  id: number;
  username: string;
}

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCourseData) => Promise<void>;
  instructors: Instructor[];
}

const emptyForm = {
  title: '',
  description: '',
  price: 0,
  instructorId: '',
  isPublished: false,
  imageUrl: '',
};

export function CreateCourseModal({ isOpen, onClose, onSubmit, instructors }: CreateCourseModalProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Enter a course title.';
    if (!formData.description.trim()) newErrors.description = 'Add a short description so learners know what to expect.';
    if (formData.price < 0) newErrors.price = 'Price can’t be negative. Use 0 for a free course.';
    if (!formData.instructorId) newErrors.instructorId = 'Choose an instructor for this course.';
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const firstInvalid = Object.keys(validateForm())[0];
    if (firstInvalid) {
      e.currentTarget.querySelector<HTMLElement>(`#create-course-${firstInvalid}`)?.focus();
      return;
    }
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      setFormData(emptyForm);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We couldn't create this course.");
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
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Add course</DialogTitle>
          <DialogDescription>You can add lessons once the course exists.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className='space-y-4'>
          <FormAlert message={submitError} />
          <Field id='create-course-title' label='Title' error={errors.title}>
            {(props) => <Input {...props} name='title' value={formData.title} onChange={handleChange} />}
          </Field>
          <Field id='create-course-description' label='Description' error={errors.description}>
            {(props) => (
              <Textarea {...props} name='description' value={formData.description} onChange={handleChange} rows={4} />
            )}
          </Field>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field id='create-course-price' label='Price (USD)' hint='Use 0 for free.' error={errors.price}>
              {(props) => (
                <Input
                  {...props}
                  name='price'
                  type='number'
                  inputMode='decimal'
                  step='0.01'
                  min='0'
                  value={formData.price}
                  onChange={handleChange}
                />
              )}
            </Field>
            <Field id='create-course-instructorId' label='Instructor' error={errors.instructorId}>
              {(props) => (
                <Select
                  value={formData.instructorId}
                  onValueChange={(instructorId) => {
                    setFormData((prev) => ({ ...prev, instructorId }));
                    if (errors.instructorId) setErrors((prev) => ({ ...prev, instructorId: '' }));
                  }}
                >
                  <SelectTrigger {...props} className='w-full'>
                    <SelectValue placeholder='Select instructor' />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id.toString()}>
                        {instructor.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>
          <Field
            id='create-course-imageUrl'
            label='Cover image URL'
            hint='Optional. A full https:// URL or a path under /images/.'
          >
            {(props) => (
              <Input
                {...props}
                name='imageUrl'
                type='url'
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder='https://example.com/image.jpg'
              />
            )}
          </Field>
          <div className='flex items-start gap-3 rounded-lg border p-4'>
            <Checkbox
              id='create-course-published'
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublished: checked === true }))}
              aria-describedby='create-course-published-hint'
            />
            <div className='space-y-1'>
              <Label htmlFor='create-course-published'>Publish now</Label>
              <p id='create-course-published-hint' className='text-sm text-muted-foreground'>
                Published courses appear in the public catalog.
              </p>
            </div>
          </div>

          <DialogFooter className='pt-2'>
            <Button type='button' variant='outline' onClick={close} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : null}
              {isSubmitting ? 'Adding…' : 'Add course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
