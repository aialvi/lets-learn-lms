import { BadRequestException } from '@nestjs/common';
import { QuizInput } from './organizations.dto';
export const DAY = 86400000;
export interface CourseSnapshot {
  title: string;
  description?: string;
  lessons: { id: string; title: string; content?: string; videoUrl?: string }[];
  quiz: QuizInput | null;
  certificationEnabled: boolean;
  validityMonths: number | null;
  renewalMode: string;
}
export function snapshotCourse(course: any): CourseSnapshot {
  return { title: course.title, description: course.description, lessons: course.lessons.map(({ id, title, content, videoUrl }) => ({ id, title, content, videoUrl })), quiz: course.quizJson ? JSON.parse(course.quizJson) : null, certificationEnabled: course.certificationEnabled, validityMonths: course.validityMonths, renewalMode: course.renewalMode };
}
export function publicSnapshot(snapshot: CourseSnapshot) {
  return { ...snapshot, quiz: snapshot.quiz ? { ...snapshot.quiz, questions: snapshot.quiz.questions.map(({ correctIndex, ...question }) => question) } : null };
}
export function grade(quiz: QuizInput, answers: number[]) {
  if (answers.length !== quiz.questions.length || answers.some((answer, i) => answer < 0 || answer >= quiz.questions[i].options.length)) throw new BadRequestException('Answer every question with a valid option');
  const score = 100 * answers.filter((answer, i) => answer === quiz.questions[i].correctIndex).length / quiz.questions.length;
  return { score, passed: score >= quiz.passPercent };
}
export function addMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const end = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, end));
  return result;
}
export function reminderBucket(dueAt: Date, now: Date, renewal: boolean): string | null {
  const remaining = (dueAt.getTime() - now.getTime()) / DAY;
  if (remaining <= 0) return `overdue-${Math.floor(-remaining / 7)}`;
  if (remaining <= 1) return 'due-1';
  if (remaining <= 7) return 'due-7';
  if (renewal && remaining <= 30) return 'due-30';
  return null;
}
export function csvCell(value: unknown) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
