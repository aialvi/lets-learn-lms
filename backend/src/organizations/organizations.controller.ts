import { Body, Controller, Get, Header, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationAccess } from './organization-access.service';
import { OrganizationsService } from './organizations.service';
import { TrainingService } from './training.service';
import { PrismaService } from '../prisma/prisma.service';
import { AcceptInvitationDto, AnswersDto, AssignmentDto, DepartmentDto, InvitationDto, LessonCompletionDto, MembershipDto, OrganizationCourseDto, OrganizationDto, SettingsDto, TeamDto } from './organizations.dto';
import { AiService } from '../ai/ai.service';
import { StudyCoachDto } from '../ai/dto/study-coach.dto';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly access: OrganizationAccess, private readonly service: OrganizationsService, private readonly training: TrainingService, private readonly db: PrismaService, private readonly ai: AiService) {}
  @Get() list(@Request() req) { return this.service.list(req.user); }
  @Post() create(@Request() req, @Body() dto: OrganizationDto) { return this.service.create(req.user, dto); }
  @Post('invitations/accept') accept(@Request() req, @Body() dto: AcceptInvitationDto) { return this.service.accept(req.user, dto.token); }
  @Get(':orgId') async details(@Request() req, @Param('orgId') id: string) { return this.service.details(await this.access.context(id, req.user)); }
  @Patch(':orgId') async settings(@Request() req, @Param('orgId') id: string, @Body() dto: SettingsDto) { return this.service.settings(await this.access.context(id, req.user, undefined, ['admin']), dto); }
  @Post(':orgId/invitations') async invite(@Request() req, @Param('orgId') id: string, @Body() dto: InvitationDto) { return this.service.invite(await this.access.context(id, req.user, undefined, ['admin']), dto); }
  @Get(':orgId/members') async members(@Request() req, @Param('orgId') id: string) { return this.service.members(await this.access.context(id, req.user, undefined, ['admin', 'manager'])); }
  @Patch(':orgId/members/:memberId') async updateMember(@Request() req, @Param('orgId') id: string, @Param('memberId') memberId: string, @Body() dto: MembershipDto) { return this.service.updateMember(await this.access.context(id, req.user, undefined, ['admin']), memberId, dto); }
  @Get(':orgId/departments') async departments(@Request() req, @Param('orgId') id: string) { return this.service.departments(await this.access.context(id, req.user, 'teams', ['admin', 'manager'])); }
  @Post(':orgId/departments') async department(@Request() req, @Param('orgId') id: string, @Body() dto: DepartmentDto) { return this.service.createDepartment(await this.access.context(id, req.user, 'teams', ['admin']), dto); }
  @Get(':orgId/teams') async teams(@Request() req, @Param('orgId') id: string) { return this.service.teams(await this.access.context(id, req.user, 'teams')); }
  @Post(':orgId/teams') async team(@Request() req, @Param('orgId') id: string, @Body() dto: TeamDto) { return this.service.saveTeam(await this.access.context(id, req.user, 'teams', ['admin']), dto); }
  @Patch(':orgId/teams/:teamId') async updateTeam(@Request() req, @Param('orgId') id: string, @Param('teamId') teamId: string, @Body() dto: TeamDto) { return this.service.saveTeam(await this.access.context(id, req.user, 'teams', ['admin']), dto, teamId); }
  @Get(':orgId/courses') async courses(@Request() req, @Param('orgId') id: string) { return this.service.courses(await this.access.context(id, req.user)); }
  @Post(':orgId/courses') async course(@Request() req, @Param('orgId') id: string, @Body() dto: OrganizationCourseDto) { return this.service.saveCourse(await this.access.context(id, req.user, undefined, ['admin', 'instructor']), dto); }
  @Patch(':orgId/courses/:courseId') async updateCourse(@Request() req, @Param('orgId') id: string, @Param('courseId') courseId: string, @Body() dto: OrganizationCourseDto) { return this.service.saveCourse(await this.access.context(id, req.user, undefined, ['admin', 'instructor']), dto, courseId); }
  @Post(':orgId/courses/:courseId/enroll') async enroll(@Request() req, @Param('orgId') id: string, @Param('courseId') courseId: string) { return this.training.assign(await this.access.context(id, req.user), { courseId }, true); }
  @Get(':orgId/assignments') async assignments(@Request() req, @Param('orgId') id: string) {
    const ctx = await this.access.context(id, req.user, 'teams', ['admin', 'manager']);
    const ids = await this.access.visibleUserIds(ctx);
    return this.db.trainingAssignment.findMany({ where: { organizationId: id, userId: { in: ids } }, select: { id: true, userId: true, cancelledAt: true, course: { select: { title: true } }, cycles: { orderBy: { sequence: 'desc' }, take: 1, select: { dueAt: true, completedAt: true } } }, orderBy: { createdAt: 'desc' } });
  }
  @Post(':orgId/assignments') async assign(@Request() req, @Param('orgId') id: string, @Body() dto: AssignmentDto) { return this.training.assign(await this.access.context(id, req.user, 'teams', ['admin', 'manager']), dto); }
  @Post(':orgId/assignments/:assignmentId/cancel') async cancel(@Request() req, @Param('orgId') id: string, @Param('assignmentId') assignmentId: string) { return this.training.cancel(await this.access.context(id, req.user, undefined, ['admin', 'manager']), assignmentId); }
  @Get(':orgId/training') async mine(@Request() req, @Param('orgId') id: string) { return this.training.myTraining(await this.access.context(id, req.user)); }
  @Post(':orgId/training/:cycleId/lessons') async lesson(@Request() req, @Param('orgId') id: string, @Param('cycleId') cycleId: string, @Body() dto: LessonCompletionDto) { return this.training.completeLesson(await this.access.context(id, req.user), cycleId, dto.lessonId); }
  @Post(':orgId/training/:cycleId/attempts') async attempt(@Request() req, @Param('orgId') id: string, @Param('cycleId') cycleId: string, @Body() dto: AnswersDto) { return this.training.attempt(await this.access.context(id, req.user, 'assessments'), cycleId, dto.answers); }
  @Get(':orgId/certificates') async certificates(@Request() req, @Param('orgId') id: string) { return this.training.certificates(await this.access.context(id, req.user, 'certifications')); }
  @Get(':orgId/reports') async report(@Request() req, @Param('orgId') id: string, @Query() query: Record<string, string>) { return this.training.report(await this.access.context(id, req.user, 'reports', ['admin', 'manager']), query); }
  @Get(':orgId/reports.csv') @Header('Content-Type', 'text/csv; charset=utf-8') @Header('Content-Disposition', 'attachment; filename="training-report.csv"')
  async csv(@Request() req, @Param('orgId') id: string, @Query() query: Record<string, string>) { return this.training.csv(await this.access.context(id, req.user, 'reports', ['admin', 'manager']), query); }
  @Get(':orgId/notifications') async notifications(@Request() req, @Param('orgId') id: string) {
    await this.access.context(id, req.user, 'reminders');
    return this.db.notification.findMany({ where: { organizationId: id, userId: req.user.id }, select: { id: true, subject: true, message: true, readAt: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }
  @Post(':orgId/notifications/:notificationId/read') async read(@Request() req, @Param('orgId') id: string, @Param('notificationId') notificationId: string) {
    await this.access.context(id, req.user, 'reminders');
    return this.db.notification.updateMany({ where: { id: notificationId, organizationId: id, userId: req.user.id }, data: { readAt: new Date() } });
  }
  @Get(':orgId/deliveries') async deliveries(@Request() req, @Param('orgId') id: string) {
    await this.access.context(id, req.user, undefined, ['admin']);
    return this.db.notification.findMany({ where: { organizationId: id }, select: { id: true, recipient: true, subject: true, emailStatus: true, attempts: true, lastError: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }
  @Post(':orgId/deliveries/:notificationId/retry') async retry(@Request() req, @Param('orgId') id: string, @Param('notificationId') notificationId: string) {
    await this.access.context(id, req.user, undefined, ['admin']);
    return this.db.notification.updateMany({ where: { id: notificationId, organizationId: id, emailStatus: 'failed' }, data: { emailStatus: 'pending', attempts: 0, nextAttemptAt: new Date(), lastError: null } });
  }
  @Post(':orgId/ai/study-coach') async coach(@Request() req, @Param('orgId') id: string, @Body() dto: StudyCoachDto) {
    await this.access.context(id, req.user);
    return this.ai.createStudyCoachResponse(req.user.id, dto, id);
  }
}
