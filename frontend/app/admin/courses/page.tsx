'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { CourseTable } from '@/components/admin/CourseTable';
import { CreateCourseModal } from '@/components/admin/CreateCourseModal';
import { AdminPageHeader, TableSkeleton, getErrorMessage } from '@/components/admin/admin-ui';
import { CreateCourseData, UpdateCourseData } from '@/types';
import api from '@/lib/api';

type AdminCourse = Parameters<typeof CourseTable>[0]['courses'][number];
type AdminInstructor = Parameters<typeof CourseTable>[0]['instructors'][number];

export default function CoursesManagement() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [instructors, setInstructors] = useState<AdminInstructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchCourses = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setLoadError(null);
    try {
      const response = await api.get('/admin/courses');
      setCourses(
        response.data.map((course: AdminCourse & { author: AdminCourse['instructor']; isPublic: boolean }) => ({
          ...course,
          instructor: course.author,
          isPublished: course.isPublic,
        }))
      );
    } catch (error) {
      setLoadError(getErrorMessage(error, "We couldn't load courses."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchInstructors = useCallback(async () => {
    try {
      const response = await api.get('/admin/users');
      setInstructors(
        response.data.filter((user: { role: string }) => user.role === 'instructor' || user.role === 'admin')
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't load the instructor list."));
    }
  }, []);

  useEffect(() => {
    void fetchCourses();
    void fetchInstructors();
  }, [fetchCourses, fetchInstructors]);

  const handleCreateCourse = async (courseData: CreateCourseData) => {
    try {
      await api.post('/admin/courses', courseData);
      toast.success(`Course “${courseData.title}” created`);
      setIsCreateModalOpen(false);
      void fetchCourses(false);
    } catch (error) {
      throw new Error(getErrorMessage(error, "We couldn't create this course."));
    }
  };

  const handleUpdateCourse = async (id: number, courseData: UpdateCourseData) => {
    try {
      await api.patch(`/admin/courses/${id}`, courseData);
      toast.success('Course updated');
      void fetchCourses(false);
    } catch (error) {
      throw new Error(getErrorMessage(error, "We couldn't save changes to this course."));
    }
  };

  const handleDeleteCourse = async (id: number) => {
    try {
      await api.delete(`/admin/courses/${id}`);
      toast.success('Course deleted');
      void fetchCourses(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't delete this course."));
    }
  };

  const createButton = (
    <Button onClick={() => setIsCreateModalOpen(true)}>
      <Plus aria-hidden='true' />
      Add course
    </Button>
  );

  return (
    <div>
      <AdminPageHeader
        eyebrow='Catalog'
        title='Courses'
        description='Edit course details, assign instructors, and control what learners can see.'
        action={createButton}
      />

      {isLoading ? (
        <TableSkeleton label='Loading courses' columns={7} />
      ) : loadError ? (
        <ErrorState title="Courses couldn't be loaded" message={loadError} onRetry={() => void fetchCourses()} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title='No courses yet'
          description='Create a course, then add lessons to it from the Lessons page.'
          action={createButton}
        />
      ) : (
        <CourseTable
          courses={courses}
          instructors={instructors}
          onUpdate={handleUpdateCourse}
          onDelete={handleDeleteCourse}
        />
      )}

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCourse}
        instructors={instructors}
      />
    </div>
  );
}
