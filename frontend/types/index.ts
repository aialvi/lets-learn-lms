// Common types for the application

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Instructor {
  id: number;
  username: string;
  email: string;
}

export interface Course {
  imageUrl?: string | null;
  id: string;
  title: string;
  description: string;
  price?: number;
  authorId?: number;
  isPublished?: boolean;
  author: {
    id: number;
    username: string;
  };
  lessons: Lesson[];
  _count: {
    lessons: number;
    enrollments: number;
  };
}

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  courseId: string;
  completed?: boolean;
  watchTime?: number;
}

export interface CreateCourseData {
  title: string;
  description: string;
  price?: number;
  instructorId: string;
  isPublished?: boolean;
  imageUrl?: string;
}

export interface UpdateCourseData {
  imageUrl?: string;
  title?: string;
  description?: string;
  price?: number;
  authorId?: number;
  isPublished?: boolean;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

export interface CreateLessonData {
  title: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  courseId: number;
}

export interface UpdateLessonData {
  title?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order?: number;
}

export interface ProgressData {
  courseId: string;
  overallProgress: number;
  lessons: {
    id: string;
    completed: boolean;
    watchTime: number;
  }[];
}

export interface LessonWithProgress extends Lesson {
  completed: boolean;
  watchTime: number;
}
