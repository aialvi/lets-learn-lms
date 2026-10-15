/** Temporary, loopback-only demo for documentation captures. Never uses dev.db. */
const { mkdtempSync, readdirSync, rmSync, writeFileSync } = require('fs');
const { tmpdir } = require('os');
const { join, resolve } = require('path');
const { execFileSync } = require('child_process');
const root = resolve(__dirname, '..');
process.env.TRAINING_WORKER_ENABLED = 'false';
process.env.EMAIL_ENABLED = 'false';
const { Test } = require('@nestjs/testing');
const { ValidationPipe } = require('@nestjs/common');
const bcrypt = require('bcrypt');
const { AppModule } = require('../dist/app.module');
const { PrismaService } = require('../dist/prisma/prisma.service');
const { OrganizationsService } = require('../dist/organizations/organizations.service');
const { OrganizationAccess } = require('../dist/organizations/organization-access.service');
const { TrainingService } = require('../dist/organizations/training.service');
const { NotificationsService } = require('../dist/organizations/notifications.service');
const directory = mkdtempSync(join(tmpdir(), 'lets-learn-preview-'));
let app, db;
async function main() {
  const filename = join(directory, 'preview.db');
  execFileSync('python3', ['-c', "import sqlite3,glob,sys\nc=sqlite3.connect(sys.argv[1])\nfor f in sorted(glob.glob(sys.argv[2]+'/*/migration.sql')): c.executescript(open(f).read())\nc.close()", filename, join(root, 'prisma/migrations')]);
  db = new PrismaService({ datasources: { db: { url: `file:${filename}` } } });
  const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(db).compile();
  app = module.createNestApplication({ logger: ['error', 'warn'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true });
  await app.init();
  const password = await bcrypt.hash(process.env.PREVIEW_PASSWORD || 'local-preview-only', 10);
  const names = ['Alex Morgan', 'Maya Chen', 'Jordan Lee', 'Samira Rahman', 'Oliver Brooks', 'Aisha Patel'];
  const users = [];
  for (const [i, name] of names.entries()) users.push(await db.user.create({ data: { username: i === 0 ? 'alex.morgan' : name.toLowerCase().replace(' ', '.'), email: `${name.toLowerCase().replace(' ', '.')}@example.test`, firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' '), password, role: i === 0 ? 'admin' : 'student', memberships: { create: { organizationId: 'default-academic', role: i === 0 ? 'admin' : 'learner' } } } }));
  const service = app.get(OrganizationsService), access = app.get(OrganizationAccess), training = app.get(TrainingService);
  const org = await service.create(users[0], { name: 'Northstar Academy', mode: 'professional', timezone: 'Asia/Dhaka' });
  const ctx = await access.context(org.id, users[0]);
  const operations = await service.createDepartment(ctx, { name: 'Operations' });
  const engineering = await service.createDepartment(ctx, { name: 'Engineering' });
  for (const [i, user] of users.entries()) if (i) await db.membership.create({ data: { organizationId: org.id, userId: user.id, role: i === 1 ? 'manager' : 'learner', departmentId: i < 3 ? operations.id : engineering.id } });
  const members = await db.membership.findMany({ where: { organizationId: org.id } });
  await service.saveTeam(ctx, { name: 'Customer experience', departmentId: operations.id, members: members.filter(m => [users[0].id, users[1].id, users[2].id].includes(m.userId)).map(m => ({ membershipId: m.id, isManager: m.userId === users[1].id })) });
  await service.saveTeam(ctx, { name: 'Product & engineering', departmentId: engineering.id, members: members.filter(m => ![users[1].id, users[2].id].includes(m.userId)).map(m => ({ membershipId: m.id, isManager: m.userId === users[0].id })) });
  const definitions = [
    { title: 'Workplace safety essentials', description: 'Build everyday habits that keep your team safe. Learn to identify hazards, respond confidently, and create a safer workplace.', lesson: 'Recognizing workplace hazards', content: 'A safer workplace starts with observation. Check your surroundings, identify potential hazards, and report concerns before they become incidents.', prompt: 'Should you report a potential hazard before an incident occurs?', mode: 'full' },
    { title: 'Data privacy & security', description: 'Protect the information people trust us with. Develop practical skills for handling sensitive data and recognizing security risks.', lesson: 'Protecting sensitive information', content: 'Limit access to sensitive information, use approved tools, and double-check recipients before sharing data.', prompt: 'Should sensitive data only be shared through approved channels?', mode: 'quiz' },
    { title: 'Leading with empathy', description: 'Help people do their best work through active listening, constructive feedback, and thoughtful team communication.', lesson: 'The art of active listening', content: 'Give the speaker your full attention. Ask open questions, reflect back what you heard, and agree on a next step together.', prompt: 'Does active listening include asking clarifying questions?', mode: 'full' },
    { title: 'Customer experience foundations', description: 'Create meaningful customer experiences with clear communication, confident problem-solving, and consistent follow-through.', lesson: 'Understanding the customer journey', content: 'Look at each interaction from the customer’s perspective. Identify their goals, acknowledge concerns, and explain the next step clearly.', prompt: 'Should you confirm the customer understands the next step?', mode: 'quiz' },
  ];
  const courses = [];
  for (const def of definitions) {
    const created = await service.saveCourse(ctx, { title: def.title, description: def.description, lessons: [{ title: def.lesson, content: def.content }, { title: 'Put it into practice', content: 'Reflect on a recent situation at work. Write down one action you can take this week to apply what you learned.' }], quiz: { passPercent: 80, maxAttempts: null, questions: [{ type: 'boolean', prompt: def.prompt, options: ['True', 'False'], correctIndex: 0 }, { type: 'choice', prompt: 'What is the best way to put this learning into practice?', options: ['Apply it to a real situation and reflect on the result', 'Wait until the annual review', 'Keep it separate from daily work', 'Skip the follow-up'], correctIndex: 0 }] }, certificationEnabled: true, validityMonths: 12, renewalMode: def.mode });
    courses.push(created.id);
  }
  for (const [i, courseId] of courses.entries()) {
    await training.assign(ctx, { courseId, userIds: users.map(u => u.id), dueAt: new Date(Date.now() + (i + 1) * 3 * 86400000).toISOString() });
    for (const [j, user] of users.entries()) {
      const cycle = await db.trainingCycle.findFirst({ where: { assignment: { courseId, userId: user.id } } });
      const learner = await access.context(org.id, user); const snapshot = JSON.parse(cycle.snapshot);
      if ((i + j) % 3 === 0) {
        for (const lesson of snapshot.lessons) await training.completeLesson(learner, cycle.id, lesson.id);
        await training.attempt(learner, cycle.id, [0, 0]);
      } else if ((i + j) % 3 === 1) await training.completeLesson(learner, cycle.id, snapshot.lessons[0].id);
      else if (j > 2) await db.trainingCycle.update({ where: { id: cycle.id }, data: { dueAt: new Date(Date.now() - 2 * 86400000) } });
    }
  }
  const renewalCertificate = await db.certificate.findFirst({ where: { userId: users[1].id } });
  await db.certificate.update({ where: { id: renewalCertificate.id }, data: { expiresAt: new Date(Date.now() + 14 * 86400000) } });
  await training.tick();
  await service.create(users[0], { name: 'Open Learning Campus', mode: 'academic', timezone: 'Asia/Dhaka' });
  writeFileSync(join(directory, 'preview.json'), JSON.stringify({ organizationId: org.id, username: 'alex.morgan', courseIds: courses }));
  await app.listen(3001, '127.0.0.1');
  console.log(JSON.stringify({ preview: 'http://localhost:3000', organizationId: org.id, metadata: join(directory, 'preview.json') }));
}
async function close() { await app?.close(); await db?.$disconnect(); rmSync(directory, { recursive: true, force: true }); }
process.on('SIGINT', () => close().then(() => process.exit()));
process.on('SIGTERM', () => close().then(() => process.exit()));
main().catch(async error => { console.error(error); await close(); process.exitCode = 1; });
