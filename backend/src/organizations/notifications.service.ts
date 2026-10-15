import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Notification } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { DAY, reminderBucket } from './training-policy';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private transport?: ReturnType<typeof nodemailer.createTransport>;
  constructor(private readonly db: PrismaService, private readonly config: ConfigService) {}
  get emailEnabled() { return this.config.get('EMAIL_ENABLED') === 'true'; }
  get deliveryConfigured() { return this.emailEnabled && !!this.config.get('SMTP_HOST') && !!this.config.get('SMTP_FROM'); }
  onModuleInit() {
    if (this.config.get('TRAINING_WORKER_ENABLED') === 'false') return;
    // Creation and reminders are persisted even when the mail service is unavailable.
    this.timer = setInterval(() => void this.dispatch().catch(() => this.logger.error('Email worker failed; pending messages will be retried')), 60000);
    this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); this.transport?.close(); }
  async queue(db: Prisma.TransactionClient, data: Omit<Prisma.NotificationUncheckedCreateInput, 'emailStatus'>) {
    return db.notification.upsert({ where: { dedupeKey: data.dedupeKey }, update: {}, create: { ...data, emailStatus: this.emailEnabled ? 'pending' : 'disabled' } });
  }
  async trainingNotice(db: Prisma.TransactionClient, cycle: any, kind: string, now = new Date()) {
    const assignment = cycle.assignment;
    const org = await db.organization.findUnique({ where: { id: assignment.organizationId } });
    if (!org || !JSON.parse(org.modules).includes('reminders')) return;
    const member = await db.membership.findUnique({ where: { organizationId_userId: { organizationId: org.id, userId: assignment.userId } }, include: { user: true } });
    if (!member?.active || cycle.completedAt || assignment.cancelledAt) return;
    const snapshot = JSON.parse(cycle.snapshot);
    const title = kind === 'assigned' ? 'Training assigned' : kind.startsWith('overdue') ? 'Training overdue' : 'Training reminder';
    const due = cycle.dueAt ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: org.timezone }).format(cycle.dueAt) : 'No deadline';
    await this.queue(db, { organizationId: org.id, userId: member.userId, recipient: member.user.email, cycleId: cycle.id, kind, dedupeKey: `${cycle.id}:${kind}`, subject: `${title}: ${snapshot.title}`, message: `${snapshot.title}\nDue: ${due} (${org.timezone})\n${this.config.get('FRONTEND_URL') || 'http://localhost:3000'}/organizations/${org.id}?cycle=${cycle.id}`, createdAt: now });
  }
  async generateReminders(now = new Date()) {
    const cycles = await this.db.trainingCycle.findMany({ where: { completedAt: null, dueAt: { not: null }, assignment: { cancelledAt: null } }, include: { assignment: true } });
    for (const cycle of cycles) {
      const bucket = reminderBucket(cycle.dueAt!, now, !!cycle.renewalOfId);
      if (bucket) await this.trainingNotice(this.db, cycle, bucket, now);
    }
  }
  private async eligible(row: Notification) {
    if (row.invitationId) {
      const invitation = await this.db.invitation.findUnique({ where: { id: row.invitationId } });
      return !!invitation && !invitation.acceptedAt && invitation.expiresAt > new Date();
    }
    const member = row.userId && await this.db.membership.findUnique({ where: { organizationId_userId: { organizationId: row.organizationId, userId: row.userId } }, include: { organization: true } });
    if (!member || !member.active || !JSON.parse(member.organization.modules).includes('reminders')) return false;
    if (!row.cycleId) return true;
    const cycle = await this.db.trainingCycle.findUnique({ where: { id: row.cycleId }, include: { assignment: true } });
    return !!cycle && !cycle.completedAt && !cycle.assignment.cancelledAt;
  }
  async dispatch() {
    if (this.running || !this.emailEnabled) return;
    this.running = true;
    try {
      const now = new Date();
      await this.db.notification.updateMany({ where: { emailStatus: 'sending', lockedAt: { lt: new Date(now.getTime() - 5 * 60000) } }, data: { emailStatus: 'pending', lockedAt: null } });
      const rows = await this.db.notification.findMany({ where: { emailStatus: 'pending', nextAttemptAt: { lte: now } }, take: 50, orderBy: { createdAt: 'asc' } });
      for (const row of rows) {
        const claim = await this.db.notification.updateMany({ where: { id: row.id, emailStatus: 'pending' }, data: { emailStatus: 'sending', lockedAt: now, attempts: { increment: 1 } } });
        if (!claim.count) continue;
        try {
          if (!await this.eligible(row)) {
            await this.db.notification.update({ where: { id: row.id }, data: { emailStatus: 'cancelled', lockedAt: null } });
            continue;
          }
          if (!this.deliveryConfigured) throw new Error('SMTP configuration missing');
          if (!this.transport) {
            const port = Number(this.config.get('SMTP_PORT') || 587);
            this.transport = nodemailer.createTransport({ host: this.config.get('SMTP_HOST'), port, secure: port === 465, requireTLS: this.config.get('SMTP_REQUIRE_TLS') !== 'false', auth: this.config.get('SMTP_USER') ? { user: this.config.get('SMTP_USER'), pass: this.config.get('SMTP_PASSWORD') } : undefined, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000, disableFileAccess: true, disableUrlAccess: true });
            await this.transport.verify();
          }
          await this.transport.sendMail({ from: this.config.get('SMTP_FROM'), to: row.recipient, subject: row.subject, text: row.message, messageId: `<${row.id}@lets-learn.notifications>` });
          await this.db.notification.update({ where: { id: row.id }, data: { emailStatus: 'sent', lockedAt: null, lastError: null } });
        } catch (error) {
          this.transport = undefined;
          const attempts = row.attempts + 1;
          // Do not expose SMTP credentials or raw transport diagnostics in the UI.
          await this.db.notification.update({ where: { id: row.id }, data: { emailStatus: attempts >= 5 ? 'failed' : 'pending', lockedAt: null, lastError: this.deliveryConfigured ? 'Email delivery failed; check SMTP service logs.' : 'SMTP configuration missing.', nextAttemptAt: new Date(now.getTime() + Math.min(DAY, 60000 * 2 ** attempts)) } });
        }
      }
    } finally { this.running = false; }
  }
}
