export const modules = ['teams', 'assessments', 'certifications', 'reminders', 'reports'] as const;
export const moduleNames: Record<string, string> = { teams: 'Teams & training', assessments: 'Quizzes', certifications: 'Certifications', reminders: 'Reminders', reports: 'Progress reports' };
export const learningModes = [
  { value: 'professional', label: 'Professional', description: 'Team training, assessments, and reporting' },
  { value: 'academic', label: 'Academic', description: 'Course completion and certificates' },
];
export interface Organization { id: string; name: string; mode: string; timezone: string; modules: string[]; role: string; email?: { enabled: boolean; configured: boolean } }
export interface Member { id: string; userId: string; role: string; active: boolean; departmentId: string | null; user: { username: string; email: string }; }
export interface Department { id: string; name: string }
export interface Team { id: string; name: string; departmentId: string | null; members: { membershipId: string; isManager: boolean }[] }
export interface Question { type: string; prompt: string; options: string[]; correctIndex?: number }
export interface Quiz { passPercent: number; maxAttempts: number | null; questions: Question[] }
export interface CourseLesson { id?: string; title: string; content?: string; videoUrl?: string | null }
export interface Course { id: string; title: string; description: string; lessons: CourseLesson[]; quiz: Quiz | null; certificationEnabled: boolean; validityMonths: number | null; renewalMode: string; canEdit: boolean }
export interface Certificate { id: string; courseTitle: string; userId: string; issuedAt: string | null; expiresAt: string | null; legacy: boolean; user?: { username: string } }
export interface Cycle { id: string; assignmentId: string; sequence: number; mode: string; dueAt: string | null; completedAt: string | null; completedLessons: string[]; snapshot: Omit<Course, 'id' | 'canEdit'>; assignment: { cancelledAt: string | null }; attempts: { id: string; score: number; passed: boolean }[]; certificate: Certificate | null }
export interface Notice { id: string; subject: string; message: string; createdAt: string; readAt: string | null }
export interface Delivery { id: string; recipient: string; subject: string; emailStatus: string; attempts: number; lastError: string | null }
export interface ReportRow { assignmentId: string; employee: string; course: string; progress: number; status: string; certification: string; dueAt: string | null; expiresAt: string | null; quizScore: number | null; cycle: number; department: string; teams: string }
export interface Report { rows: ReportRow[]; summary: { total: number; completed: number; overdue: number; expired: number } }
export async function organizationRequest<T>(token: string, path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/organizations${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(Array.isArray(error.message) ? error.message.join('. ') : error.message || `Request failed (${response.status})`);
  }
  return response.json();
}
export function displayDate(value: string | null, timezone = 'UTC') { return value ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(new Date(value)) : '—'; }
/** Native input/select/textarea styling that matches components/ui/input. */
export const control = 'mt-1.5 block min-h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-base font-normal text-foreground shadow-xs transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';
/** Wrapping <label> for a text label + control. */
export const fieldLabel = 'block text-sm font-medium text-foreground';
/** Native checkbox/radio styling. */
export const check = 'size-4 shrink-0 accent-primary';
export const panel = 'surface space-y-4 p-5 sm:p-6';
