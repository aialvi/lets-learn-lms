import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Membership, Organization } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type Actor = { id: string; email: string; role: string };
export type OrganizationContext = { organization: Organization; membership: Membership; user: Actor; modules: string[] };
@Injectable()
export class OrganizationAccess {
  constructor(private readonly db: PrismaService) {}
  async context(organizationId: string, user: Actor, module?: string, roles?: string[]): Promise<OrganizationContext> {
    const membership = await this.db.membership.findUnique({ where: { organizationId_userId: { organizationId, userId: user.id } }, include: { organization: true } });
    if (!membership?.active) throw new ForbiddenException('Active organization membership required');
    const ctx = { organization: membership.organization, membership, user, modules: JSON.parse(membership.organization.modules) as string[] };
    if (module && !ctx.modules.includes(module)) throw new ForbiddenException(`${module} module is disabled`);
    if (roles && !roles.includes(membership.role)) throw new ForbiddenException('This action is not permitted for your organization role');
    return ctx;
  }
  async course(ctx: OrganizationContext, id: string, edit = false) {
    const course = await this.db.course.findFirst({ where: { id, organizationId: ctx.organization.id }, include: { lessons: { orderBy: { order: 'asc' } } } });
    if (!course) throw new NotFoundException('Course not found');
    if (edit && ctx.membership.role !== 'admin' && !(ctx.membership.role === 'instructor' && course.authorId === ctx.user.id)) throw new ForbiddenException('Only an administrator or the course author can edit this course');
    return course;
  }
  async visibleUserIds(ctx: OrganizationContext): Promise<string[]> {
    const where = ctx.membership.role === 'admin' ? {} : ctx.membership.role === 'manager' ? {
      teams: { some: { team: { members: { some: { membershipId: ctx.membership.id, isManager: true } } } } },
    } : { userId: ctx.user.id };
    const rows = await this.db.membership.findMany({ where: { organizationId: ctx.organization.id, ...where }, select: { userId: true } });
    return rows.map(row => row.userId);
  }
}
