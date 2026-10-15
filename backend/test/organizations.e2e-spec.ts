import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { execFileSync } from 'child_process';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { jwtConstants } from '../src/auth/constants';
import { TrainingService } from '../src/organizations/training.service';
import { NotificationsService } from '../src/organizations/notifications.service';
import { DAY } from '../src/organizations/training-policy';

describe('organization learning workflows', () => {
  let app: INestApplication; let db: PrismaService; let directory: string;
  let orgId: string; let otherOrgId: string; let admin: string; let employee: string; let manager: string; let outsider: string;
  let courseId: string; let cycleId: string; let assignmentId: string;
  const tokens: Record<string, string> = {};
  const call = (who: string, method: string, path: string, body?: unknown) => request(app.getHttpServer())[method](path).set('Authorization', `Bearer ${tokens[who]}`).send(body);
  const url = (path = '') => `/organizations/${orgId}${path}`;
  const course = (renewalMode = 'full') => ({ title: '=Safety training', description: 'Annual safety training', lessons: [{ title: 'Safety basics', content: 'Always use protective equipment.' }], quiz: { passPercent: 80, maxAttempts: 3, questions: [{ type: 'boolean', prompt: 'Use protective equipment?', options: ['True', 'False'], correctIndex: 0 }] }, certificationEnabled: true, validityMonths: 12, renewalMode });

  beforeAll(async () => {
    process.env.TRAINING_WORKER_ENABLED = 'false'; process.env.EMAIL_ENABLED = 'false';
    directory = mkdtempSync(join(tmpdir(), 'lets-learn-test-'));
    const filename = join(directory, 'test.db');
    execFileSync('python3', ['-c', `import sqlite3,glob,sys\nc=sqlite3.connect(sys.argv[1])\nfor f in sorted(glob.glob(sys.argv[2]+'/*/migration.sql')): c.executescript(open(f).read())\nc.close()`, filename, resolve(__dirname, '../prisma/migrations')]);
    db = new PrismaService({ datasources: { db: { url: `file:${filename}` } } });
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(db).compile();
    app = module.createNestApplication(); app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true })); await app.init();
    const password = await bcrypt.hash('password123', 4);
    for (const name of ['admin', 'employee', 'manager', 'outsider']) {
      const user = await db.user.create({ data: { username: name, email: `${name}@example.test`, password, role: name === 'admin' ? 'admin' : 'student', memberships: { create: { organizationId: 'default-academic', role: name === 'admin' ? 'admin' : 'learner' } } } });
      tokens[name] = new JwtService({ secret: jwtConstants.secret }).sign({ sub: user.id });
      if (name === 'admin') admin = user.id; if (name === 'employee') employee = user.id; if (name === 'manager') manager = user.id; if (name === 'outsider') outsider = user.id;
    }
  }, 30000);
  afterAll(async () => { await app?.close(); await db?.$disconnect(); if (directory) rmSync(directory, { recursive: true, force: true }); });

  it('creates organizations only for platform administrators and preserves academic membership', async () => {
    await call('employee', 'post', '/organizations', { name: 'No', mode: 'professional' }).expect(403);
    const result = await call('admin', 'post', '/organizations', { name: 'Acme', mode: 'professional', timezone: 'Asia/Dhaka' }).expect(201);
    orgId = result.body.id; expect(result.body.modules).toContain('reports');
    const other = await call('admin', 'post', '/organizations', { name: 'Other', mode: 'professional' }).expect(201); otherOrgId = other.body.id;
    await db.membership.createMany({ data: [{ organizationId: orgId, userId: employee, role: 'learner' }, { organizationId: orgId, userId: manager, role: 'manager' }, { organizationId: otherOrgId, userId: outsider, role: 'learner' }] });
    expect((await call('employee', 'get', '/organizations').expect(200)).body.map(o => o.id)).toContain('default-academic');
    await call('outsider', 'get', url()).expect(403);
  });
  it('validates organization settings and preserves the last active admin', async () => {
    await call('admin', 'patch', url(), { timezone: 'Moon/Crater' }).expect(400);
    await call('admin', 'patch', url(), { modules: ['reports'] }).expect(400);
    const member = await db.membership.findUnique({ where: { organizationId_userId: { organizationId: orgId, userId: admin } } });
    await call('admin', 'patch', url(`/members/${member!.id}`), { active: false }).expect(409);
  });
  it('accepts invitations once, with matching email and valid expiry', async () => {
    const invite = await call('admin', 'post', url('/invitations'), { email: 'outsider@example.test', role: 'learner' }).expect(201);
    const token = new URL(invite.body.invitationUrl).searchParams.get('token');
    await call('employee', 'post', '/organizations/invitations/accept', { token }).expect(403);
    await call('outsider', 'post', '/organizations/invitations/accept', { token }).expect(201);
    await call('outsider', 'post', '/organizations/invitations/accept', { token }).expect(400);
    const expired = await call('admin', 'post', url('/invitations'), { email: 'outsider@example.test', role: 'admin' });
    await db.invitation.update({ where: { id: expired.body.id }, data: { expiresAt: new Date(Date.now() - DAY) } });
    await call('outsider', 'post', '/organizations/invitations/accept', { token: new URL(expired.body.invitationUrl).searchParams.get('token') }).expect(400);
  });
  it('limits manager visibility to assigned teams and rejects foreign memberships', async () => {
    const members = await db.membership.findMany({ where: { organizationId: orgId } });
    const employeeMember = members.find(m => m.userId === employee)!; const managerMember = members.find(m => m.userId === manager)!;
    const foreign = await db.membership.findUnique({ where: { organizationId_userId: { organizationId: otherOrgId, userId: outsider } } });
    await call('admin', 'post', url('/teams'), { name: 'Invalid', members: [{ membershipId: foreign!.id, isManager: false }] }).expect(400);
    await call('admin', 'post', url('/teams'), { name: 'Operations', members: [{ membershipId: employeeMember.id, isManager: false }, { membershipId: managerMember.id, isManager: true }] }).expect(201);
    const response = await call('manager', 'get', url('/members')).expect(200);
    expect(response.body.map(m => m.userId)).toEqual(expect.arrayContaining([employee, manager])); expect(response.body.map(m => m.userId)).not.toContain(outsider);
  });
  it('keeps private courses and quiz keys off public routes', async () => {
    const response = await call('admin', 'post', url('/courses'), course()).expect(201); courseId = response.body.id;
    const catalog = await call('employee', 'get', url('/courses')).expect(200);
    expect(catalog.body[0].quiz.questions[0]).not.toHaveProperty('correctIndex');
    expect((await request(app.getHttpServer()).get('/courses').expect(200)).body.map(c => c.id)).not.toContain(courseId);
    await request(app.getHttpServer()).get(`/courses/${courseId}`).expect(404);
    await call('employee', 'get', `/lessons?courseId=${courseId}`).expect(404);
    await call('employee', 'post', '/enrollments', { courseId }).expect(404);
    await call('admin', 'patch', `/admin/courses/${courseId}`, { title: 'Leak' }).expect(404);
    await call('employee', 'post', url('/courses'), course()).expect(403);
  });
  it('creates independent assignments, validates manager scope, and deduplicates repeat assignments', async () => {
    await call('manager', 'post', url('/assignments'), { courseId, userIds: [outsider] }).expect(403);
    const result = await call('manager', 'post', url('/assignments'), { courseId, userIds: [employee], dueAt: new Date(Date.now() + 6 * DAY).toISOString() }).expect(201); assignmentId = result.body[0].id;
    expect((await call('manager', 'post', url('/assignments'), { courseId, userIds: [employee] }).expect(201)).body[0].existing).toBe(true);
    const mine = await call('employee', 'get', url('/training')).expect(200); cycleId = mine.body[0].id;
    expect(mine.body[0].snapshot.quiz.questions[0]).not.toHaveProperty('correctIndex');
    await call('outsider', 'post', url(`/training/${cycleId}/attempts`), { answers: [0] }).expect(404);
    await call('employee', 'post', url(`/training/${cycleId}/attempts`), { answers: [0] }).expect(400);
  });
  it('preserves a published snapshot when course content changes', async () => {
    const edited = course(); edited.title = 'Updated safety'; edited.quiz.questions[0].correctIndex = 1;
    await call('admin', 'patch', url(`/courses/${courseId}`), edited).expect(200);
    const cycle = await db.trainingCycle.findUnique({ where: { id: cycleId } });
    expect(JSON.parse(cycle!.snapshot).title).toBe('=Safety training');
    expect(JSON.parse(cycle!.snapshot).quiz.questions[0].correctIndex).toBe(0);
    await call('admin', 'patch', url(), { modules: ['teams', 'certifications', 'reminders', 'reports'] }).expect(409);
  });
  it('deduplicates reminders and cancels queued notices after completion', async () => {
    const notifications = app.get(NotificationsService);
    await notifications.generateReminders(); await notifications.generateReminders();
    expect(await db.notification.count({ where: { cycleId, kind: 'due-7' } })).toBe(1);
    const cycle = await db.trainingCycle.findUnique({ where: { id: cycleId } }); const lesson = JSON.parse(cycle!.snapshot).lessons[0];
    await call('employee', 'post', url(`/training/${cycleId}/lessons`), { lessonId: 'invalid' }).expect(400);
    await call('employee', 'post', url(`/training/${cycleId}/lessons`), { lessonId: lesson.id }).expect(201);
    expect((await call('employee', 'post', url(`/training/${cycleId}/attempts`), { answers: [1] }).expect(201)).body.passed).toBe(false);
    await db.notification.updateMany({ where: { cycleId }, data: { emailStatus: 'pending' } });
    expect((await call('employee', 'post', url(`/training/${cycleId}/attempts`), { answers: [0] }).expect(201)).body.passed).toBe(true);
    expect(await db.notification.count({ where: { cycleId, emailStatus: 'pending' } })).toBe(0);
    const certificates = (await call('employee', 'get', url('/certificates')).expect(200)).body;
    expect(certificates).toHaveLength(1); expect(certificates[0].issuedAt).toBeTruthy(); expect(certificates[0].expiresAt).toBeTruthy();
    await call('employee', 'post', url(`/training/${cycleId}/attempts`), { answers: [0] }).expect(409);
  });
  it('opens one renewal cycle and keeps original progress and attempts', async () => {
    const certificate = await db.certificate.findUnique({ where: { cycleId } });
    await db.certificate.update({ where: { id: certificate!.id }, data: { expiresAt: new Date(Date.now() + 20 * DAY) } });
    const training = app.get(TrainingService); await training.tick(); await training.tick();
    const cycles = await db.trainingCycle.findMany({ where: { assignmentId }, orderBy: { sequence: 'asc' }, include: { attempts: true } });
    expect(cycles).toHaveLength(2); expect(cycles[0].attempts).toHaveLength(2); expect(cycles[1].completedLessons).toBe('[]'); expect(cycles[1].mode).toBe('full');
    const snapshot = JSON.parse(cycles[1].snapshot);
    await call('employee', 'post', url(`/training/${cycles[1].id}/lessons`), { lessonId: snapshot.lessons[0].id }).expect(201);
    await call('employee', 'post', url(`/training/${cycles[1].id}/attempts`), { answers: [0] }).expect(201);
    const renewed = await db.certificate.findUnique({ where: { cycleId: cycles[1].id } });
    const previous = await db.certificate.findUnique({ where: { cycleId } });
    expect(renewed!.expiresAt!.getTime() - previous!.expiresAt!.getTime()).toBeGreaterThan(364 * DAY);
  });
  it('supports quiz-only renewal and enforces attempt limits', async () => {
    const body = course('quiz'); body.title = 'Quiz renewal'; body.quiz.maxAttempts = 1;
    const created = await call('admin', 'post', url('/courses'), body).expect(201);
    await call('admin', 'post', url('/assignments'), { courseId: created.body.id, userIds: [employee] }).expect(201);
    const original = await db.trainingCycle.findFirst({ where: { assignment: { courseId: created.body.id } } });
    await call('employee', 'post', url(`/training/${original!.id}/lessons`), { lessonId: JSON.parse(original!.snapshot).lessons[0].id }).expect(201);
    await call('employee', 'post', url(`/training/${original!.id}/attempts`), { answers: [0] }).expect(201);
    const certificate = await db.certificate.findUnique({ where: { cycleId: original!.id } });
    await db.certificate.update({ where: { id: certificate!.id }, data: { expiresAt: new Date(Date.now() - DAY) } });
    await app.get(TrainingService).tick();
    const renewal = await db.trainingCycle.findUnique({ where: { renewalOfId: certificate!.id } }); expect(renewal!.mode).toBe('quiz');
    await call('employee', 'post', url(`/training/${renewal!.id}/attempts`), { answers: [1] }).expect(201);
    await call('employee', 'post', url(`/training/${renewal!.id}/attempts`), { answers: [0] }).expect(409);
  });
  it('retries email failures, records delivery, and cancels stale reminders', async () => {
    const active = await db.trainingCycle.findFirst({ where: { completedAt: null, assignment: { cancelledAt: null } } });
    const notice = await db.notification.findFirst({ where: { cycleId: active!.id } });
    await db.notification.updateMany({ data: { emailStatus: 'disabled' } });
    await db.notification.update({ where: { id: notice!.id }, data: { emailStatus: 'pending', nextAttemptAt: new Date(0) } });
    const sendMail = jest.fn().mockRejectedValueOnce(new Error('Temporary outage')).mockResolvedValue({ accepted: ['employee@example.test'] });
    const transport = jest.spyOn(nodemailer, 'createTransport').mockReturnValue({ verify: jest.fn().mockResolvedValue(true), sendMail, close: jest.fn() } as any);
    const previous = { EMAIL_ENABLED: process.env.EMAIL_ENABLED, SMTP_HOST: process.env.SMTP_HOST, SMTP_FROM: process.env.SMTP_FROM };
    Object.assign(process.env, { EMAIL_ENABLED: 'true', SMTP_HOST: 'test.invalid', SMTP_FROM: 'test@example.test' });
    try {
      const worker = app.get(NotificationsService);
      await worker.dispatch();
      const failed = await db.notification.findUnique({ where: { id: notice!.id } });
      expect(failed!.emailStatus).toBe('pending'); expect(failed!.attempts).toBe(1); expect(failed!.lastError).toBeTruthy();
      await db.notification.update({ where: { id: notice!.id }, data: { nextAttemptAt: new Date(0) } });
      await worker.dispatch(); await worker.dispatch();
      expect(sendMail).toHaveBeenCalledTimes(2);
      expect((await db.notification.findUnique({ where: { id: notice!.id } }))!.emailStatus).toBe('sent');
      const stale = await db.notification.findFirst({ where: { cycleId } });
      await db.notification.update({ where: { id: stale!.id }, data: { emailStatus: 'pending', nextAttemptAt: new Date(0) } });
      await worker.dispatch(); expect(sendMail).toHaveBeenCalledTimes(2);
      expect((await db.notification.findUnique({ where: { id: stale!.id } }))!.emailStatus).toBe('cancelled');
    } finally {
      transport.mockRestore(); for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    }
  });
  it('reports and exports only managed employees, with safe CSV values', async () => {
    const report = await call('manager', 'get', url('/reports')).expect(200);
    expect(report.body.rows.every(row => row.employee === 'employee')).toBe(true);
    expect(report.body.summary.expired).toBe(1);
    const csv = await call('manager', 'get', url('/reports.csv')).expect(200);
    expect(csv.text).toContain("'=Safety training");
    expect((await call('manager', 'get', url(`/reports?userId=${outsider}`)).expect(200)).body.rows).toHaveLength(0);
    await call('employee', 'get', url('/reports')).expect(403);
    await call('outsider', 'get', `/organizations/${otherOrgId}/reports`).expect(403);
  });
  it('cancels future renewals and enforces module switches at API level', async () => {
    const assignments = await db.trainingAssignment.findMany({ where: { organizationId: orgId } });
    for (const assignment of assignments) await call('admin', 'post', url(`/assignments/${assignment.id}/cancel`)).expect(201);
    await call('admin', 'patch', url(), { modules: [] }).expect(200);
    await call('employee', 'get', url('/certificates')).expect(403);
    await call('manager', 'get', url('/reports.csv')).expect(403);
    await call('admin', 'post', url('/assignments'), { courseId, userIds: [employee] }).expect(403);
    expect(await db.certificate.count({ where: { organizationId: orgId } })).toBe(3);
  });
  it('prevents profile escalation and rejects inactive members', async () => {
    await call('employee', 'put', `/users/${employee}`, { role: 'admin', firstName: 'Updated' }).expect(200);
    expect((await db.user.findUnique({ where: { id: employee } }))!.role).toBe('student');
    await call('employee', 'get', `/users/${outsider}`).expect(403);
    const membership = await db.membership.findUnique({ where: { organizationId_userId: { organizationId: orgId, userId: employee } } });
    await call('admin', 'patch', url(`/members/${membership!.id}`), { active: false }).expect(200);
    await call('employee', 'get', url('/training')).expect(403);
  });
  it('keeps registration and login working with a default academic membership', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({ username: 'new-student', email: 'new@example.test', password: 'password123', role: 'admin' }).expect(201);
    const login = await request(app.getHttpServer()).post('/auth/login').send({ username: 'new-student', password: 'password123' }).expect(201);
    expect(login.body.user.role).toBe('student');
    expect(await db.membership.count({ where: { userId: login.body.user.id, organizationId: 'default-academic' } })).toBe(1);
  });
});
