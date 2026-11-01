'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ListVideo, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LessonTable } from '@/components/admin/LessonTable';
import CreateLessonModal from '@/components/admin/CreateLessonModal';
import { AdminPageHeader, TableSkeleton, getErrorMessage } from '@/components/admin/admin-ui';
import { CreateLessonData, UpdateLessonData } from '@/types';
import api from '@/lib/api';

type AdminLesson = Parameters<typeof LessonTable>[0]['lessons'][number];
type AdminCourse = Parameters<typeof LessonTable>[0]['courses'][number];

export default function LessonsManagement() {
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchLessons = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setLoadError(null);
    try {
      const response = await api.get('/admin/lessons');
      setLessons(response.data);
    } catch (error) {
      setLoadError(getErrorMessage(error, "We couldn't load lessons."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await api.get('/admin/courses');
      setCourses(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't load the course list."));
    }
  }, []);

  useEffect(() => {
    void fetchLessons();
    void fetchCourses();
  }, [fetchLessons, fetchCourses]);

  const handleCreateLesson = async (lessonData: CreateLessonData) => {
    try {
      await api.post('/admin/lessons', lessonData);
      toast.success(`Lesson “${lessonData.title}” created`);
      setIsCreateModalOpen(false);
      void fetchLessons(false);
    } catch (error) {
      throw new Error(getErrorMessage(error, "We couldn't create this lesson."));
    }
  };

  const handleUpdateLesson = async (id: number, lessonData: UpdateLessonData) => {
    try {
      await api.patch(`/admin/lessons/${id}`, lessonData);
      toast.success('Lesson updated');
      void fetchLessons(false);
    } catch (error) {
      throw new Error(getErrorMessage(error, "We couldn't save changes to this lesson."));
    }
  };

  const handleDeleteLesson = async (id: number) => {
    try {
      await api.delete(`/admin/lessons/${id}`);
      toast.success('Lesson deleted');
      void fetchLessons(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't delete this lesson."));
    }
  };

  const createButton = (
    <Button onClick={() => setIsCreateModalOpen(true)}>
      <Plus aria-hidden='true' />
      Add lesson
    </Button>
  );

  return (
    <div>
      <AdminPageHeader
        eyebrow='Content'
        title='Lessons'
        description='Add, edit, and reorder the lessons inside each course.'
        action={createButton}
      />

      {isLoading ? (
        <TableSkeleton label='Loading lessons' columns={6} />
      ) : loadError ? (
        <ErrorState title="Lessons couldn't be loaded" message={loadError} onRetry={() => void fetchLessons()} />
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={ListVideo}
          title='No lessons yet'
          description={
            courses.length
              ? 'Add the first lesson to one of your courses.'
              : 'Lessons belong to a course. Create a course first, then come back to add lessons.'
          }
          action={
            courses.length ? (
              createButton
            ) : (
              <Button asChild>
                <Link href='/admin/courses'>Go to courses</Link>
              </Button>
            )
          }
        />
      ) : (
        <LessonTable
          lessons={lessons}
          courses={courses}
          onUpdate={handleUpdateLesson}
          onDelete={handleDeleteLesson}
        />
      )}

      <CreateLessonModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLesson}
        courses={courses}
      />
    </div>
  );
}
