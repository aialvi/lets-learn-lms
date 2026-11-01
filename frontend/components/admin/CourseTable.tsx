'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate, truncateText } from '@/lib/utils';
import { EditCourseModal } from './EditCourseModal';
import { RowActions, TableSurface } from './admin-ui';
import { UpdateCourseData } from '@/types';

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
  createdAt: string;
  isPublished: boolean;
}

interface CourseTableProps {
  courses: Course[];
  instructors: Instructor[];
  onUpdate: (id: number, courseData: UpdateCourseData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function CourseTable({ courses, instructors, onUpdate, onDelete }: CourseTableProps) {
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  return (
    <>
      <TableSurface>
        <Table>
          <TableCaption className='sr-only'>Courses ({courses.length})</TableCaption>
          <TableHeader className='bg-muted/40'>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead className='text-right'>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='w-24 text-right'>
                <span className='sr-only'>Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className='min-w-64 max-w-md whitespace-normal'>
                  <p className='font-medium text-foreground'>{course.title}</p>
                  <p className='text-muted-foreground'>{truncateText(course.description, 80)}</p>
                </TableCell>
                <TableCell>{course.instructor?.username || 'Unassigned'}</TableCell>
                <TableCell className='text-right tabular-nums'>
                  {course.price ? currency.format(course.price) : 'Free'}
                </TableCell>
                <TableCell>
                  <Badge variant={course.isPublished ? 'success' : 'secondary'}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell className='whitespace-nowrap text-muted-foreground'>
                  {formatDate(course.createdAt)}
                </TableCell>
                <TableCell>
                  <RowActions
                    itemType='course'
                    itemLabel={course.title}
                    onEdit={() => setEditingCourse(course)}
                    onDelete={() => onDelete(course.id)}
                    deleteDescription='This permanently deletes the course along with its lessons and enrollments.'
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableSurface>

      {editingCourse && (
        <EditCourseModal
          course={editingCourse}
          instructors={instructors}
          isOpen={!!editingCourse}
          onClose={() => setEditingCourse(null)}
          onSubmit={async (data) => {
            await onUpdate(editingCourse.id, data);
            setEditingCourse(null);
          }}
        />
      )}
    </>
  );
}
