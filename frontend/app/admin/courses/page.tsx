'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CourseTable } from '@/components/admin/CourseTable';
import { CreateCourseModal } from '@/components/admin/CreateCourseModal';
import { CreateCourseData, UpdateCourseData } from '@/types';
import api from '@/lib/api';

export default function CoursesManagement() {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/courses');
      setCourses(response.data.map((course: { author: unknown; isPublic: boolean }) => ({ ...course, instructor: course.author, isPublished: course.isPublic })));
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await api.get('/admin/users');
      const instructorUsers = response.data.filter((user: { role: string }) => 
        user.role === 'instructor' || user.role === 'admin'
      );
      setInstructors(instructorUsers);
    } catch (error) {
      console.error('Failed to fetch instructors:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchInstructors();
  }, []);

  const handleCreateCourse = async (courseData: CreateCourseData) => {
    try {
      await api.post('/admin/courses', courseData);
      fetchCourses();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  };

  const handleUpdateCourse = async (id: number, courseData: UpdateCourseData) => {
    try {
      await api.patch(`/admin/courses/${id}`, courseData);
      fetchCourses();
    } catch (error) {
      console.error('Failed to update course:', error);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    try {
      await api.delete(`/admin/courses/${id}`);
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mt-16 mb-6">
        <h1 className="text-3xl font-bold">Courses Management</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Create Course</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">Loading...</div>
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
