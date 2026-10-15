/** Local documentation captures against real API data; no account passwords are changed. */
import { chromium, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { encode } from 'next-auth/jwt';

const backendRequire = createRequire(new URL('../../backend/package.json', import.meta.url));
const dotenv = backendRequire('dotenv');
dotenv.config({ path: fileURLToPath(new URL('../../backend/.env', import.meta.url)) });
dotenv.config({ path: fileURLToPath(new URL('../.env.local', import.meta.url)) });
const { PrismaClient } = backendRequire('@prisma/client');
const { JwtService } = backendRequire('@nestjs/jwt');
const db = new PrismaClient();
const username = process.argv[2] || 'lyxodyhaxi';
const baseURL = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) throw new Error('Documentation capture only supports a local frontend.');
const output = fileURLToPath(new URL('../../docs/screenshots/', import.meta.url));
await mkdir(output, { recursive: true });
let browser;

async function sessionContext(user) {
  const accessToken = new JwtService({ secret: process.env.JWT_SECRET || 'development-only-change-before-deploying' }).sign({ username: user.username, sub: user.id, email: user.email, role: user.role }, { expiresIn: '1h' });
  const value = await encode({ secret: process.env.NEXTAUTH_SECRET || 'your-secret-here-replace-in-production', token: { id: user.id, sub: user.id, name: user.username, email: user.email, role: user.role, accessToken }, maxAge: 3600 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'en-US', timezoneId: 'Asia/Dhaka' });
  await context.addCookies([{ name: 'next-auth.session-token', value, url: baseURL, httpOnly: true, sameSite: 'Lax' }]);
  return context;
}

async function capture(page, name, fullPage = false) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, image => image.decode().catch(() => {})));
  });
  const broken = await page.locator('img').evaluateAll(images => images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src));
  if (broken.length) throw new Error(`Broken images on ${page.url()}: ${broken.join(', ')}`);
  await page.screenshot({ path: `${output}${name}.png`, fullPage, animations: 'disabled', style: 'nextjs-portal { display: none !important; }' });
}

try {
  const learner = await db.user.findUniqueOrThrow({ where: { username } });
  const web = await db.course.findFirstOrThrow({ where: { title: 'Modern Web Development' } });
  const data = await db.course.findFirstOrThrow({ where: { title: 'Data Analysis Essentials' } });
  const enrollment = await db.enrollment.findUniqueOrThrow({ where: { userId_courseId: { userId: learner.id, courseId: data.id } } });
  expect(enrollment.progress).toBe(100);
  browser = await chromium.launch({ headless: true });
  const context = await sessionContext(learner);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && /\/(courses|enrollments|progress|auth\/session)/.test(response.url())) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(`${baseURL}/dashboard`);
  await expect(page.getByRole('heading', { name: `Welcome back, ${username}.` })).toBeVisible({ timeout: 60000 });
  await expect(page.getByText('50% Complete', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('100% Complete', { exact: true })).toBeVisible();
  await expect(page.locator('img[src^="/images/courses/"]')).toHaveCount(6);
  await capture(page, 'learner-dashboard');

  await page.goto(`${baseURL}/courses`);
  await expect(page.getByRole('heading', { name: 'Modern Web Development', exact: true })).toBeVisible();
  await expect(page.locator('article')).toHaveCount(await db.course.count({ where: { organizationId: 'default-academic', isPublic: true } }));
  await capture(page, 'learning-catalog', true);

  await page.goto(`${baseURL}/courses/${web.id}`);
  await expect(page.getByRole('button', { name: 'Continue Learning', exact: true })).toBeVisible();
  await capture(page, 'course-overview');

  await page.goto(`${baseURL}/courses/${web.id}/lessons/sample-web-development-3`);
  await expect(page).toHaveURL(new RegExp(`/courses/${web.id}/lessons/`));
  await expect(page.getByText('Add accessible interactions', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('50%', { exact: false }).first()).toBeVisible();
  await capture(page, 'lesson-workspace');

  // Navigate from an established session before capturing a credential.
  await page.goto(`${baseURL}/dashboard`);
  await expect(page.getByRole('heading', { name: `Welcome back, ${username}.` })).toBeVisible();
  await page.goto(`${baseURL}/courses/${data.id}/certificate`);
  await expect(page.getByText('Certificate of Completion', { exact: false }).first()).toBeVisible();
  await capture(page, 'learner-certificate');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/dashboard`);
  await expect(page.getByRole('heading', { name: `Welcome back, ${username}.` })).toBeVisible();
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Dashboard overflows at mobile width');
  await capture(page, 'learner-mobile', true);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Captured six screenshots for ${username} in docs/screenshots. Live data, progress, images, and mobile overflow checks passed.`);
} finally {
  await browser?.close();
  await db.$disconnect();
}
