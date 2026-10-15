import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationAccess, OrganizationContext } from './organization-access.service';
import { AssignmentDto } from './organizations.dto';
import { NotificationsService } from './notifications.service';
import { addMonths, CourseSnapshot, csvCell, DAY, grade, publicSnapshot, snapshotCourse } from './training-policy';

@Injectable()
export class TrainingService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly logger = new Logger(TrainingService.name);
  constructor(private readonly db: PrismaService, private readonly access: OrganizationAccess, private readonly notifications: NotificationsService, private readonly config: ConfigService) {}
  onModuleInit() {
    if (this.config.get('TRAINING_WORKER_ENABLED') === 'false') return;
    this.timer = setInterval(() => void this.tick().catch(() => this.logger.error('Training worker failed; it will retry next minute')), 60000);
    this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  async tick(now = new Date()) {
    if (this.running) return;
    this.running = true;
    try { await this.openRenewals(now); await this.notifications.generateReminders(now); } finally { this.running = false; }
  }
  private checkModules(ctx: OrganizationContext, snapshot: CourseSnapshot) {
    if (snapshot.quiz && !ctx.modules.includes('assessments')) throw new ForbiddenException('Assessments module is disabled');
    if (snapshot.certificationEnabled && !ctx.modules.includes('certifications')) throw new ForbiddenException('Certifications module is disabled');
  }
  async assign(ctx: OrganizationContext, dto: AssignmentDto, self = false) {
    const course = await this.access.course(ctx, dto.courseId);
    if (!course.lessons.length) throw new BadRequestException('Add a lesson before assigning this course');
    const snapshot = snapshotCourse(course);
    this.checkModules(ctx, snapshot);
    if (dto.dueAt && new Date(dto.dueAt) <= new Date()) throw new BadRequestException('Choose a future deadline');
    let ids = self ? [ctx.user.id] : dto.userIds || [];
    if (!self && dto.teamId) {
      const team = await this.db.team.findFirst({ where: { id: dto.teamId, organizationId: ctx.organization.id }, include: { members: { include: { membership: true } } } });
      if (!team) throw new NotFoundException('Team not found');
      if (ctx.membership.role === 'manager' && !team.members.some(m => m.membershipId === ctx.membership.id && m.isManager)) throw new ForbiddenException('You can only assign training to your managed teams');
      ids = [...ids, ...team.members.filter(m => m.membership.active).map(m => m.membership.userId)];
    }
    ids = [...new Set(ids)];
    if (!ids.length) throw new BadRequestException('Select at least one employee or a nonempty team');
    const visible = self ? ids : await this.access.visibleUserIds(ctx);
    const members = await this.db.membership.findMany({ where: { organizationId: ctx.organization.id, active: true, userId: { in: ids } } });
    if (members.length !== ids.length || ids.some(id => !visible.includes(id))) throw new ForbiddenException('Select active employees within your management scope');
    return this.db.$transaction(async tx => {
      const result: { id: string; userId: string; existing: boolean }[] = [];
      for (const userId of ids) {
        const existing = await tx.trainingAssignment.findFirst({ where: { organizationId: ctx.organization.id, userId, courseId: course.id, cancelledAt: null }, orderBy: { createdAt: 'desc' } });
        if (existing) { result.push({ id: existing.id, userId, existing: true }); continue; }
        const assignment = await tx.trainingAssignment.create({ data: { organizationId: ctx.organization.id, userId, courseId: course.id, sourceTeamId: self ? null : dto.teamId || null } });
        const cycle = await tx.trainingCycle.create({ data: { assignmentId: assignment.id, snapshot: JSON.stringify(snapshot), dueAt: dto.dueAt ? new Date(dto.dueAt) : null } });
        await this.notifications.trainingNotice(tx, { ...cycle, assignment }, 'assigned');
        result.push({ id: assignment.id, userId, existing: false });
      }
      return result;
    });
  }
  async cancel(ctx: OrganizationContext, id: string) {
    const users = await this.access.visibleUserIds(ctx);
    const assignment = await this.db.trainingAssignment.findFirst({ where: { id, organizationId: ctx.organization.id, userId: { in: users } } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return this.db.$transaction(async tx => {
      await tx.trainingAssignment.update({ where: { id }, data: { cancelledAt: new Date() } });
      const cycles = await tx.trainingCycle.findMany({ where: { assignmentId: id }, select: { id: true } });
      await tx.notification.updateMany({ where: { cycleId: { in: cycles.map(c => c.id) }, emailStatus: 'pending' }, data: { emailStatus: 'cancelled' } });
      return { cancelled: true };
    });
  }
  async myTraining(ctx: OrganizationContext) {
    const cycles = await this.db.trainingCycle.findMany({ where: { assignment: { organizationId: ctx.organization.id, userId: ctx.user.id } }, include: { assignment: true, attempts: { orderBy: { createdAt: 'desc' } }, certificate: true }, orderBy: { openedAt: 'desc' } });
    return cycles.map(cycle => this.present(cycle, ctx));
  }
  private present(cycle: any, ctx: OrganizationContext) {
    const snapshot = publicSnapshot(JSON.parse(cycle.snapshot));
    if (!ctx.modules.includes('assessments')) snapshot.quiz = null;
    return { ...cycle, snapshot, completedLessons: JSON.parse(cycle.completedLessons), attempts: ctx.modules.includes('assessments') ? cycle.attempts : [], certificate: ctx.modules.includes('certifications') ? cycle.certificate : null };
  }
  private async ownCycle(tx: Prisma.TransactionClient, ctx: OrganizationContext, id: string) {
    const cycle = await tx.trainingCycle.findFirst({ where: { id, assignment: { organizationId: ctx.organization.id, userId: ctx.user.id, cancelledAt: null } }, include: { assignment: true, attempts: true } });
    if (!cycle) throw new NotFoundException('Active training cycle not found');
    if (cycle.completedAt) throw new ConflictException('This training cycle is already completed');
    this.checkModules(ctx, JSON.parse(cycle.snapshot));
    return cycle;
  }
  async completeLesson(ctx: OrganizationContext, cycleId: string, lessonId: string) {
    return this.db.$transaction(async tx => {
      const cycle = await this.ownCycle(tx, ctx, cycleId);
      const snapshot: CourseSnapshot = JSON.parse(cycle.snapshot);
      if (!snapshot.lessons.some(l => l.id === lessonId)) throw new BadRequestException('Lesson is not part of this training cycle');
      const completed = [...new Set<string>([...JSON.parse(cycle.completedLessons), lessonId])];
      await tx.trainingCycle.update({ where: { id: cycleId }, data: { completedLessons: JSON.stringify(completed) } });
      await this.finish(tx, { ...cycle, completedLessons: JSON.stringify(completed) });
      return { completedLessons: completed };
    });
  }
  async attempt(ctx: OrganizationContext, cycleId: string, answers: number[]) {
    return this.db.$transaction(async tx => {
      const cycle = await this.ownCycle(tx, ctx, cycleId);
      const snapshot: CourseSnapshot = JSON.parse(cycle.snapshot);
      if (!snapshot.quiz) throw new BadRequestException('No quiz is required for this cycle');
      if (cycle.mode === 'full' && JSON.parse(cycle.completedLessons).length < snapshot.lessons.length) throw new BadRequestException('Complete all lessons before taking the quiz');
      if (snapshot.quiz.maxAttempts && cycle.attempts.length >= snapshot.quiz.maxAttempts) throw new ConflictException('Attempt limit reached; contact your administrator');
      const result = grade(snapshot.quiz, answers);
      const attempt = await tx.quizAttempt.create({ data: { cycleId, answers: JSON.stringify(answers), ...result } });
      await this.finish(tx, { ...cycle, attempts: [...cycle.attempts, attempt] });
      return attempt;
    });
  }
  private async finish(tx: Prisma.TransactionClient, cycle: any) {
    const snapshot: CourseSnapshot = JSON.parse(cycle.snapshot);
    const completed = JSON.parse(cycle.completedLessons) as string[];
    if (cycle.mode !== 'quiz' && !snapshot.lessons.every(l => completed.includes(l.id))) return;
    if (snapshot.quiz && !cycle.attempts.some(a => a.passed)) return;
    const now = new Date();
    const changed = await tx.trainingCycle.updateMany({ where: { id: cycle.id, completedAt: null }, data: { completedAt: now } });
    if (!changed.count) return;
    if (snapshot.certificationEnabled) {
      const previous = cycle.renewalOfId ? await tx.certificate.findUnique({ where: { id: cycle.renewalOfId } }) : null;
      const start = previous?.expiresAt && previous.expiresAt > now ? previous.expiresAt : now;
      await tx.certificate.create({ data: { organizationId: cycle.assignment.organizationId, userId: cycle.assignment.userId, courseId: cycle.assignment.courseId, courseTitle: snapshot.title, cycleId: cycle.id, issuedAt: now, expiresAt: snapshot.validityMonths ? addMonths(start, snapshot.validityMonths) : null } });
    }
    await tx.notification.updateMany({ where: { cycleId: cycle.id, emailStatus: 'pending' }, data: { emailStatus: 'cancelled' } });
  }
  async openRenewals(now = new Date()) {
    const certificates = await this.db.certificate.findMany({ where: { legacy: false, expiresAt: { lte: new Date(now.getTime() + 30 * DAY) }, cycleId: { not: null }, cycle: { assignment: { cancelledAt: null } } }, include: { cycle: { include: { assignment: true } } } });
    for (const certificate of certificates) {
      if (!certificate.cycle) continue;
      const { assignment } = certificate.cycle;
      const member = await this.db.membership.findUnique({ where: { organizationId_userId: { organizationId: assignment.organizationId, userId: assignment.userId } }, include: { organization: true } });
      if (!member?.active) continue;
      const modules = JSON.parse(member.organization.modules);
      // Renewal uses the prior published requirements; policy edits affect new assignments.
      const snapshot: CourseSnapshot = JSON.parse(certificate.cycle.snapshot);
      if (!modules.includes('certifications') || snapshot.quiz && !modules.includes('assessments')) continue;
      await this.db.$transaction(async tx => {
        if (await tx.trainingCycle.findUnique({ where: { renewalOfId: certificate.id } })) return;
        const cycle = await tx.trainingCycle.create({ data: { assignmentId: assignment.id, sequence: certificate.cycle!.sequence + 1, renewalOfId: certificate.id, snapshot: certificate.cycle!.snapshot, mode: snapshot.renewalMode, dueAt: certificate.expiresAt, openedAt: now } });
        await this.notifications.trainingNotice(tx, { ...cycle, assignment }, 'assigned', now);
      });
    }
  }
  async certificates(ctx: OrganizationContext) {
    const ids = await this.access.visibleUserIds(ctx);
    return this.db.certificate.findMany({ where: { organizationId: ctx.organization.id, userId: { in: ids } }, include: { user: { select: { username: true } } }, orderBy: { issuedAt: 'desc' } });
  }
  async report(ctx: OrganizationContext, query: Record<string, string>) {
    const ids = await this.access.visibleUserIds(ctx);
    const members = await this.db.membership.findMany({ where: { organizationId: ctx.organization.id, userId: { in: ids }, ...(query.departmentId ? { departmentId: query.departmentId } : {}), ...(query.teamId ? { teams: { some: { teamId: query.teamId } } } : {}) }, include: { user: { select: { username: true, email: true } }, department: true, teams: { include: { team: true } } } });
    const visible = members.filter(m => !query.userId || m.userId === query.userId);
    const assignments = await this.db.trainingAssignment.findMany({ where: { organizationId: ctx.organization.id, userId: { in: visible.map(m => m.userId) }, ...(query.courseId ? { courseId: query.courseId } : {}) }, include: { cycles: { orderBy: { sequence: 'desc' }, include: { attempts: true, certificate: true } } }, orderBy: { createdAt: 'desc' } });
    const now = new Date();
    const rows = assignments.map(assignment => {
      const member = visible.find(m => m.userId === assignment.userId)!;
      const cycle = assignment.cycles[0];
      const snapshot: CourseSnapshot = JSON.parse(cycle.snapshot);
      const lessons = JSON.parse(cycle.completedLessons).length;
      const progress = cycle.completedAt ? 100 : cycle.mode === 'quiz' ? 0 : Math.round(100 * lessons / (snapshot.lessons.length + (snapshot.quiz ? 1 : 0)));
      const status = assignment.cancelledAt ? 'cancelled' : cycle.completedAt ? 'completed' : cycle.dueAt && cycle.dueAt < now ? 'overdue' : 'in-progress';
      const cert = assignment.cycles.map(c => c.certificate).find(Boolean);
      const certification = !snapshot.certificationEnabled ? 'not-required' : !cert ? 'not-issued' : !cert.expiresAt ? 'valid' : cert.expiresAt <= now ? 'expired' : cert.expiresAt.getTime() - now.getTime() <= 30 * DAY ? 'due-for-renewal' : 'valid';
      return { assignmentId: assignment.id, userId: member.userId, employee: member.user.username, email: member.user.email, active: member.active, department: member.department?.name || '', teams: member.teams.map(t => t.team.name).join(', '), courseId: assignment.courseId, course: snapshot.title, cycle: cycle.sequence, progress, status, quizScore: ctx.modules.includes('assessments') && cycle.attempts.length ? Math.max(...cycle.attempts.map(a => a.score)) : null, dueAt: cycle.dueAt, certification: ctx.modules.includes('certifications') ? certification : 'module-disabled', expiresAt: ctx.modules.includes('certifications') ? cert?.expiresAt || null : null };
    }).filter(row => !query.status || row.status === query.status);
    return { rows, summary: { total: rows.length, completed: rows.filter(r => r.status === 'completed').length, overdue: rows.filter(r => r.status === 'overdue').length, expired: rows.filter(r => r.certification === 'expired').length } };
  }
  async csv(ctx: OrganizationContext, query: Record<string, string>) {
    const { rows } = await this.report(ctx, query);
    const columns = ['employee', 'email', 'department', 'teams', 'course', 'cycle', 'progress', 'status', 'quizScore', 'dueAt', 'certification', 'expiresAt'];
    return [columns.map(csvCell).join(','), ...rows.map(row => columns.map(key => csvCell(row[key] instanceof Date ? row[key].toISOString() : row[key])).join(','))].join('\r\n');
  }
}
