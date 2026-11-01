'use client';

import { useState } from 'react';
import { Video } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, truncateText } from '@/lib/utils';
import { EditLessonModal } from '@/components/admin/EditLessonModal';
import { RowActions, TableSurface } from './admin-ui';

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
  createdAt: string;
}

interface EditLessonData {
  title: string;
  description: string;
  duration: number;
  courseId: string;
  videoUrl?: string;
}

interface LessonTableProps {
  lessons: Lesson[];
  courses: Course[];
  onUpdate: (id: number, data: EditLessonData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function LessonTable({ lessons, courses, onUpdate, onDelete }: LessonTableProps) {
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  return (
    <>
      <TableSurface>
        <Table>
          <TableCaption className='sr-only'>Lessons ({lessons.length})</TableCaption>
          <TableHeader className='bg-muted/40'>
            <TableRow>
              <TableHead>Lesson</TableHead>
              <TableHead>Course</TableHead>
              <TableHead className='text-right'>Duration</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='w-24 text-right'>
                <span className='sr-only'>Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.map((lesson) => (
              <TableRow key={lesson.id}>
                <TableCell className='min-w-64 max-w-md whitespace-normal'>
                  <p className='flex items-center gap-1.5 font-medium text-foreground'>
                    {lesson.title}
                    {lesson.videoUrl ? (
                      <Video aria-label='Has video' className='size-3.5 shrink-0 text-muted-foreground' />
                    ) : null}
                  </p>
                  {lesson.description ? (
                    <p className='text-muted-foreground'>{truncateText(lesson.description, 80)}</p>
                  ) : null}
                </TableCell>
                <TableCell>{lesson.course?.title || 'Unknown course'}</TableCell>
                <TableCell className='whitespace-nowrap text-right tabular-nums'>
                  {lesson.duration ? `${lesson.duration} min` : '—'}
                </TableCell>
                <TableCell className='whitespace-nowrap text-muted-foreground'>
                  {formatDate(lesson.createdAt)}
                </TableCell>
                <TableCell>
                  <RowActions
                    itemType='lesson'
                    itemLabel={lesson.title}
                    onEdit={() => setEditingLesson(lesson)}
                    onDelete={() => onDelete(lesson.id)}
                    deleteDescription='This permanently removes the lesson from its course, along with learner progress for it.'
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableSurface>

      {editingLesson && (
        <EditLessonModal
          lesson={editingLesson}
          courses={courses}
          isOpen={!!editingLesson}
          onClose={() => setEditingLesson(null)}
          onSubmit={async (data) => {
            await onUpdate(editingLesson.id, data);
            setEditingLesson(null);
          }}
        />
      )}
    </>
  );
}
