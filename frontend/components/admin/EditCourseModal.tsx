'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { FormAlert } from './admin-ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SelectField } from '@/components/ui/select-field';
import { Checkbox } from '@/components/ui/checkbox';

interface Instructor {
  id: number;
  username: string;
}

interface Course {
  imageUrl?: string | null;
  id: number;
  title: string;
  description: string;
  price: number;
  instructor: {
    id: number;
    username: string;
  };
  isPublished: boolean;
  createdAt: string;
}

interface EditCourseModalProps {
  course: Course;
  instructors: Instructor[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CourseFormValues) => Promise<void>;
}

const courseFormSchema = z.object({
  imageUrl: z.union([z.string().url(), z.string().startsWith('/images/'), z.literal('')]).optional(),
  title: z.string().min(3, {
    message: 'Title must be at least 3 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  price: z.coerce.number<number>().min(0, {
    message: 'Price must be a positive number.',
  }),
  instructorId: z.string({
    error: "Please select an instructor",
  }),
  isPublished: z.boolean().default(false),
});

type CourseFormValues = z.output<typeof courseFormSchema>;

export function EditCourseModal({
  course,
  instructors,
  isOpen,
  onClose,
  onSubmit,
}: EditCourseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.input<typeof courseFormSchema>, unknown, CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      imageUrl: course.imageUrl || '',
      title: course.title,
      description: course.description,
      price: course.price,
      instructorId: course.instructor?.id ? String(course.instructor.id) : "",
      isPublished: course.isPublished,
    },
  });

  const handleSubmit = async (data: CourseFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We couldn't save changes to this course.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit course</DialogTitle>
          <DialogDescription>Changes are visible to learners as soon as you save.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormAlert message={submitError} />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Course title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Course description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor</FormLabel>
                  <FormControl>
                    <SelectField
                      ref={field.ref}
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder='Select an instructor'
                      emptyMessage='No instructors available'
                      options={instructors.map((instructor) => ({ value: String(instructor.id), label: instructor.username }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://images.unsplash.com/…" {...field} />
                  </FormControl>
                  <FormDescription>Optional. A full https:// URL or a path under /images/.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel>Published</FormLabel>
                    <FormDescription>Published courses appear in the public catalog.</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner /> : null}
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
