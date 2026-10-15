import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Actor, OrganizationAccess, OrganizationContext } from './organization-access.service';
import { DepartmentDto, InvitationDto, MembershipDto, MODULES, OrganizationCourseDto, OrganizationDto, SettingsDto, TeamDto } from './organizations.dto';
import { NotificationsService } from './notifications.service';
import { DAY, publicSnapshot, snapshotCourse } from './training-policy';

@Injectable()
export class OrganizationsService {
  constructor(private readonly db: PrismaService, private readonly access: OrganizationAccess, private readonly notifications: NotificationsService, private readonly config: ConfigService) {}
  private timezone(value: string) { try { new Intl.DateTimeFormat('en', { timeZone: value }); } catch { throw new BadRequestException('Invalid timezone'); } }
  private modules(values: string[]) {
    if (values.includes('reports') && !values.includes('teams')) throw new BadRequestException('Reports require Teams and training');
  }
  async list(user: Actor) {
    const memberships = await this.db.membership.findMany({ where: { userId: user.id, active: true }, include: { organization: true } });
    return memberships.map(m => ({ ...m.organization, modules: JSON.parse(m.organization.modules), role: m.role }));
  }
  async create(user: Actor, dto: OrganizationDto) {
    if (user.role !== 'admin') throw new ForbiddenException('Only platform administrators can create organizations');
    this.timezone(dto.timezone || 'UTC');
    const organization = await this.db.organization.create({ data: { name: dto.name.trim(), mode: dto.mode, timezone: dto.timezone || 'UTC', modules: JSON.stringify(dto.mode === 'professional' ? MODULES : ['certifications']), memberships: { create: { userId: user.id, role: 'admin' } } } });
    if (dto.adminEmail && dto.adminEmail.toLowerCase() !== user.email.toLowerCase()) await this.invite(await this.access.context(organization.id, user), { email: dto.adminEmail, role: 'admin' });
    return { ...organization, modules: JSON.parse(organization.modules) };
  }
  async details(ctx: OrganizationContext) {
    return { ...ctx.organization, modules: ctx.modules, role: ctx.membership.role, email: { enabled: this.notifications.emailEnabled, configured: this.notifications.deliveryConfigured } };
  }
  async settings(ctx: OrganizationContext, dto: SettingsDto) {
    if (dto.timezone) this.timezone(dto.timezone);
    const modules = dto.modules || (dto.mode && dto.mode !== ctx.organization.mode ? dto.mode === 'professional' ? [...MODULES] : ['certifications'] : ctx.modules);
    this.modules(modules);
    const removed = ctx.modules.filter(module => !modules.includes(module));
    await this.db.$transaction(async tx => {
      if (removed.length) {
        const assignments = await tx.trainingAssignment.findMany({ where: { organizationId: ctx.organization.id, cancelledAt: null }, include: { cycles: true } });
        const required = new Set<string>();
        for (const assignment of assignments) {
          // Recurring assignments remain active between renewal windows.
          for (const cycle of assignment.cycles) {
            const snapshot = JSON.parse(cycle.snapshot);
            if (!cycle.completedAt || snapshot.certificationEnabled && snapshot.validityMonths) {
              required.add('teams'); required.add('reminders');
              if (snapshot.quiz) required.add('assessments');
              if (snapshot.certificationEnabled) required.add('certifications');
            }
          }
        }
        if (removed.some(module => required.has(module))) throw new ConflictException('Complete or cancel training that depends on these modules before disabling them');
      }
      await tx.organization.update({ where: { id: ctx.organization.id }, data: { name: dto.name, mode: dto.mode, timezone: dto.timezone, modules: JSON.stringify(modules) } });
    });
    return this.details(await this.access.context(ctx.organization.id, ctx.user));
  }
  async invite(ctx: OrganizationContext, dto: InvitationDto) {
    const token = randomBytes(32).toString('hex');
    const email = dto.email.toLowerCase();
    const link = `${this.config.get('FRONTEND_URL') || 'http://localhost:3000'}/organizations/join?token=${token}`;
    const invitation = await this.db.$transaction(async tx => {
      const row = await tx.invitation.create({ data: { organizationId: ctx.organization.id, email, role: dto.role, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 7 * DAY) } });
      await this.notifications.queue(tx, { organizationId: ctx.organization.id, recipient: email, kind: 'invitation', invitationId: row.id, dedupeKey: `invite:${row.id}`, subject: `Join ${ctx.organization.name}`, message: `You have been invited to ${ctx.organization.name}. Sign in or create an account using ${email}, then accept this invitation within seven days:\n${link}` });
      return row;
    });
    return { id: invitation.id, email, role: dto.role, expiresAt: invitation.expiresAt, invitationUrl: link };
  }
  async accept(user: Actor, token: string) {
    return this.db.$transaction(async tx => {
      const invite = await tx.invitation.findUnique({ where: { tokenHash: createHash('sha256').update(token).digest('hex') } });
      if (!invite || invite.acceptedAt || invite.expiresAt <= new Date()) throw new BadRequestException('Invitation is invalid, expired, or already accepted');
      if (invite.email.toLowerCase() !== user.email.toLowerCase()) throw new ForbiddenException('Sign in with the email address on this invitation');
      const membership = await tx.membership.findUnique({ where: { organizationId_userId: { organizationId: invite.organizationId, userId: user.id } } });
      if (membership && !membership.active) throw new ForbiddenException('Ask your organization administrator to reactivate your membership');
      // A stale invitation must never change the privileges of an existing member.
      if (!membership) await tx.membership.create({ data: { organizationId: invite.organizationId, userId: user.id, role: invite.role } });
      await tx.invitation.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
      return { organizationId: invite.organizationId };
    });
  }
  async members(ctx: OrganizationContext) {
    const ids = await this.access.visibleUserIds(ctx);
    return this.db.membership.findMany({ where: { organizationId: ctx.organization.id, userId: { in: ids } }, include: { user: { select: { id: true, username: true, email: true, firstName: true, lastName: true } }, department: true, teams: { include: { team: true } } } });
  }
  async updateMember(ctx: OrganizationContext, id: string, dto: MembershipDto) {
    if (dto.departmentId !== undefined && !ctx.modules.includes('teams')) throw new ForbiddenException('Teams module is disabled');
    return this.db.$transaction(async tx => {
      const member = await tx.membership.findFirst({ where: { id, organizationId: ctx.organization.id } });
      if (!member) throw new NotFoundException('Member not found');
      if (dto.departmentId && !await tx.department.findFirst({ where: { id: dto.departmentId, organizationId: ctx.organization.id } })) throw new BadRequestException('Department not found');
      if (member.role === 'admin' && member.active && (dto.active === false || dto.role && dto.role !== 'admin')) {
        const count = await tx.membership.count({ where: { organizationId: ctx.organization.id, active: true, role: 'admin' } });
        if (count === 1) throw new ConflictException('An organization must retain an active administrator');
      }
      if (dto.role && !['admin', 'manager'].includes(dto.role)) await tx.teamMember.updateMany({ where: { membershipId: id }, data: { isManager: false } });
      if (dto.active === false) await tx.notification.updateMany({ where: { organizationId: ctx.organization.id, userId: member.userId, emailStatus: 'pending' }, data: { emailStatus: 'cancelled' } });
      return tx.membership.update({ where: { id }, data: dto });
    });
  }
  departments(ctx: OrganizationContext) { return this.db.department.findMany({ where: { organizationId: ctx.organization.id }, orderBy: { name: 'asc' } }); }
  createDepartment(ctx: OrganizationContext, dto: DepartmentDto) { return this.db.department.create({ data: { organizationId: ctx.organization.id, name: dto.name } }); }
  teams(ctx: OrganizationContext) {
    return this.db.team.findMany({ where: { organizationId: ctx.organization.id, ...(ctx.membership.role === 'admin' ? {} : { members: { some: { membershipId: ctx.membership.id } } }) }, include: { members: true, department: true } });
  }
  async saveTeam(ctx: OrganizationContext, dto: TeamDto, id?: string) {
    if (dto.departmentId && !await this.db.department.findFirst({ where: { id: dto.departmentId, organizationId: ctx.organization.id } })) throw new BadRequestException('Department not found');
    if (new Set(dto.members.map(m => m.membershipId)).size !== dto.members.length) throw new BadRequestException('Duplicate team member');
    const members = await this.db.membership.findMany({ where: { organizationId: ctx.organization.id, active: true, id: { in: dto.members.map(m => m.membershipId) } } });
    if (members.length !== dto.members.length || dto.members.some(m => m.isManager && !['manager', 'admin'].includes(members.find(member => member.id === m.membershipId)!.role))) throw new BadRequestException('Team members must be active; team managers must have the manager or admin role');
    return this.db.$transaction(async tx => {
      if (id && !await tx.team.findFirst({ where: { id, organizationId: ctx.organization.id } })) throw new NotFoundException('Team not found');
      if (id) await tx.teamMember.deleteMany({ where: { teamId: id } });
      const data = { name: dto.name, departmentId: dto.departmentId || null, members: { create: dto.members } };
      return id ? tx.team.update({ where: { id }, data, include: { members: true } }) : tx.team.create({ data: { ...data, organizationId: ctx.organization.id }, include: { members: true } });
    });
  }
  async courses(ctx: OrganizationContext) {
    const courses = await this.db.course.findMany({ where: { organizationId: ctx.organization.id }, include: { lessons: { orderBy: { order: 'asc' } } }, orderBy: { title: 'asc' } });
    return courses.map(course => {
      const { quizJson, ...rest } = course;
      const canEdit = ctx.membership.role === 'admin' || ctx.membership.role === 'instructor' && course.authorId === ctx.user.id;
      return { ...rest, canEdit, quiz: !ctx.modules.includes('assessments') ? null : canEdit ? snapshotCourse(course).quiz : publicSnapshot(snapshotCourse(course)).quiz };
    });
  }
  async saveCourse(ctx: OrganizationContext, dto: OrganizationCourseDto, id?: string) {
    if (id) await this.access.course(ctx, id, true);
    if (dto.quiz && !ctx.modules.includes('assessments')) throw new ForbiddenException('Enable assessments first');
    if (dto.certificationEnabled && !ctx.modules.includes('certifications')) throw new ForbiddenException('Enable certifications first');
    if (dto.validityMonths && !dto.certificationEnabled) throw new BadRequestException('Enable certification before setting validity');
    if (dto.certificationEnabled && dto.validityMonths && !dto.quiz) throw new BadRequestException('Recurring certification requires a quiz');
    if (dto.renewalMode === 'quiz' && !dto.quiz) throw new BadRequestException('Quiz-only renewal requires a quiz');
    if (dto.quiz?.questions.some(q => q.correctIndex >= q.options.length || q.options.some(option => !option.trim()) || q.type === 'boolean' && (q.options.length !== 2 || q.options[0] !== 'True' || q.options[1] !== 'False'))) throw new BadRequestException('Questions need valid choices; true/false choices must be True and False');
    const data = { title: dto.title, description: dto.description || '', quizJson: dto.quiz ? JSON.stringify(dto.quiz) : '', certificationEnabled: dto.certificationEnabled, validityMonths: dto.validityMonths || null, renewalMode: dto.renewalMode };
    return this.db.$transaction(async tx => {
      const course = id ? await tx.course.update({ where: { id }, data }) : await tx.course.create({ data: { ...data, organizationId: ctx.organization.id, authorId: ctx.user.id, price: 0, isPublic: false } });
      const existing = await tx.lesson.findMany({ where: { courseId: course.id } });
      const supplied = dto.lessons.filter(l => l.id).map(l => l.id!);
      if (new Set(supplied).size !== supplied.length || supplied.some(lessonId => !existing.some(l => l.id === lessonId))) throw new BadRequestException('Invalid lesson identifier');
      await tx.lesson.deleteMany({ where: { courseId: course.id, id: { notIn: supplied } } });
      for (const [index, lesson] of dto.lessons.entries()) {
        const lessonData = { title: lesson.title, content: lesson.content || '', videoUrl: lesson.videoUrl || null, order: index + 1 };
        if (lesson.id) await tx.lesson.update({ where: { id: lesson.id }, data: lessonData });
        else await tx.lesson.create({ data: { ...lessonData, id: randomUUID(), courseId: course.id } });
      }
      return { id: course.id };
    });
  }
}
