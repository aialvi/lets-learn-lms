'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { FormAlert } from './admin-ui';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SelectField } from '@/components/ui/select-field';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

interface Course {
  id: number;
  title: string;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  duration: number;
  courseId: string;
  videoUrl?: string;
  course?: Course;
}

interface EditLessonData {
  title: string;
  description: string;
  duration: number;
  courseId: string;
  videoUrl?: string;
}

interface EditLessonModalProps {
  lesson: Lesson;
  courses: Course[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditLessonData) => Promise<void>;
}

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  duration: z.coerce.number<number>().min(1, 'Duration must be at least 1 minute'),
  courseId: z.string().min(1, 'Course is required'),
  videoUrl: z.string().optional(),
});

export function EditLessonModal({
  lesson,
  courses,
  isOpen,
  onClose,
  onSubmit,
}: EditLessonModalProps) {
  const form = useForm<z.input<typeof formSchema>, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      courseId: lesson.courseId,
      videoUrl: lesson.videoUrl || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        courseId: lesson.courseId,
        videoUrl: lesson.videoUrl || '',
      });
    }
  }, [isOpen, lesson, form]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const isSubmitting = form.formState.isSubmitting;

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We couldn't save changes to this lesson.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Edit lesson</DialogTitle>
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
                    <Input placeholder="Enter lesson title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter lesson description" 
                      {...field}
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <FormControl>
                    <SelectField
                      ref={field.ref}
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder='Select a course'
                      emptyMessage='Create a course first'
                      options={courses.map((course) => ({ value: String(course.id), label: course.title }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter lesson duration in minutes" 
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
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="url"
                      placeholder="Enter video URL" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='pt-2'>
              <Button variant='outline' onClick={onClose} type='button' disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
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
