import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDate, truncateText } from '@/lib/utils';
import { EditCourseModal } from './EditCourseModal';
import { UpdateCourseData } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Instructor {
  id: number;
  username: string;
}

interface Course {
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

export function CourseTable({
  courses,
  instructors,
  onUpdate,
  onDelete,
}: CourseTableProps) {
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell>{course.id}</TableCell>
              <TableCell>{course.title}</TableCell>
              <TableCell>{truncateText(course.description, 50)}</TableCell>
              <TableCell>${course.price.toFixed(2)}</TableCell>
              <TableCell>{course.instructor?.username || 'Unknown'}</TableCell>
              <TableCell>
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-medium ${
                    course.isPublished
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {course.isPublished ? 'Published' : 'Draft'}
                </span>
              </TableCell>
              <TableCell>{formatDate(course.createdAt)}</TableCell>
              <TableCell>
                <div className='flex space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setEditingCourse(course)}
                  >
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant='destructive' size='sm'>
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the course and all associated lessons and
                          enrollments.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(course.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
