import { CallHandler, ExecutionContext, ForbiddenException, Injectable, NestInterceptor, NotFoundException } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

/** Compatibility endpoints serve only the original public academic workspace. */
@Injectable()
export class LegacyAccessInterceptor implements NestInterceptor {
  constructor(private readonly db: PrismaService) {}
  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const path = req.path as string;
    if (path.startsWith('/organizations')) return next.handle();
    const writing = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    const user = req.user;
    const admin = user?.role === 'admin';
    if (/^\/users(?:\/|$)/.test(path) && path !== '/users/profile') {
      if (!admin && (path === '/users' || req.params.id !== user?.id)) throw new ForbiddenException('You can only access your own profile');
      if (writing) {
        const fields = ['username', 'firstName', 'lastName'];
        if (admin) fields.push('email', 'role');
        req.body = Object.fromEntries(fields.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
      }
    }
    const learning = /^\/(?:courses|lessons|enrollments|progress)(?:\/|$)/.test(path) || /^\/admin\/(?:courses|lessons)(?:\/|$)/.test(path);
    if (learning) {
      let courseId = req.params.courseId || req.body?.courseId || req.query?.courseId;
      const lessonId = req.params.lessonId || req.body?.lessonId || (/\/(?:admin\/)?lessons\//.test(path) ? req.params.id : undefined);
      if (lessonId) {
        const lesson = await this.db.lesson.findUnique({ where: { id: String(lessonId) } });
        if (!lesson || courseId && lesson.courseId !== courseId) throw new NotFoundException('Lesson not found');
        courseId = lesson.courseId;
      }
      if (/\/(?:admin\/)?courses\//.test(path)) courseId = req.params.id;
      let course: any;
      if (courseId) {
        course = await this.db.course.findFirst({ where: { id: String(courseId), organizationId: 'default-academic', isPublic: true } });
        if (!course) throw new NotFoundException('Course not found');
      }
      if (user) {
        const member = await this.db.membership.findUnique({ where: { organizationId_userId: { organizationId: 'default-academic', userId: user.id } } });
        if (!member?.active) throw new ForbiddenException('Active academic membership required');
        if (writing && /^\/(?:admin\/)?(?:courses|lessons)(?:\/|$)/.test(path)) {
          if (!admin && !(member.role === 'instructor' && (!course || course.authorId === user.id))) throw new ForbiddenException('Only the course author or an administrator can edit content');
          const keys = /lessons/.test(path) ? ['title', 'content', 'description', 'videoUrl', 'order', 'courseId'] : ['title', 'description', 'price', 'instructorId'];
          req.body = Object.fromEntries(keys.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
        }
      }
      if (writing && /^\/(?:enrollments\/progress|progress\/course\/)/.test(path) && courseId && user) {
        const total = await this.db.lesson.count({ where: { courseId } });
        const complete = await this.db.videoProgress.count({ where: { userId: user.id, courseId, completed: true, lesson: { courseId } } });
        req.body.progress = total ? complete / total * 100 : 0;
      }
    }
    // Legacy APIs must never expose assessment answer keys, including nested courses.
    const redact = (value: any): any => {
      if (Array.isArray(value)) return value.map(redact);
      if (!value || typeof value !== 'object' || value instanceof Date) return value;
      return Object.fromEntries(Object.entries(value).filter(([key]) => !['quizJson', 'password'].includes(key)).map(([key, item]) => [key, redact(item)]));
    };
    return next.handle().pipe(map(redact));
  }
}
