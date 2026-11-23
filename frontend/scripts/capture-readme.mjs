/** README launch slides from the running app and real API data; no account passwords are changed. */
import { chromium, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { encode } from 'next-auth/jwt';
import { appFont, brand, copy, phone, popFrom, renderSlide, win } from './launch-slides.mjs';

const backendRequire = createRequire(new URL('../../backend/package.json', import.meta.url));
const dotenv = backendRequire('dotenv');
dotenv.config({ path: fileURLToPath(new URL('../../backend/.env', import.meta.url)), quiet: true });
dotenv.config({ path: fileURLToPath(new URL('../.env.local', import.meta.url)), quiet: true });
const { PrismaClient } = backendRequire('@prisma/client');
const { JwtService } = backendRequire('@nestjs/jwt');
const db = new PrismaClient();
const username = process.argv[2] || 'alex.morgan';
const baseURL = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000';
// A frontend pointed at `pnpm run preview:organizations`; its slides are skipped when unset.
const orgURL = process.env.SCREENSHOT_ORG_URL;
for (const url of [baseURL, orgURL].filter(Boolean))
  if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Documentation capture only supports a local frontend.');
const output = fileURLToPath(new URL('../../docs/screenshots/', import.meta.url));
await mkdir(output, { recursive: true });
const errors = [];
let browser;

const desktop = { viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'Asia/Dhaka' };
const mobile = { ...desktop, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

async function newPage(options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400 && /\/(courses|enrollments|progress|organizations|auth\/session)/.test(response.url())) errors.push(`${response.status()} ${response.url()}`);
  });
  return page;
}

async function learnerPage(user, options = {}) {
  const accessToken = new JwtService({ secret: process.env.JWT_SECRET || 'development-only-change-before-deploying' }).sign({ username: user.username, sub: user.id, email: user.email, role: user.role }, { expiresIn: '1h' });
  const value = await encode({ secret: process.env.NEXTAUTH_SECRET || 'your-secret-here-replace-in-production', token: { id: user.id, sub: user.id, name: user.username, email: user.email, role: user.role, accessToken }, maxAge: 3600 });
  const page = await newPage({ ...desktop, colorScheme: 'light', ...options });
  await page.context().addCookies([{ name: 'next-auth.session-token', value, url: baseURL, httpOnly: true, sameSite: 'Lax' }]);
  return page;
}

async function shoot(target, page = target) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading=lazy]').forEach((image) => (image.loading = 'eager'));
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => {})));
    await Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {})));
  });
  const broken = await page.locator('img').evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src));
  if (broken.length) throw new Error(`Broken images on ${page.url()}: ${broken.join(', ')}`);
  return target.screenshot({ animations: 'disabled', style: 'nextjs-portal,[data-sonner-toaster]{display:none!important}' });
}

async function shootElement(locator, page) {
  const shot = await shoot(locator, page);
  return { shot, rect: await locator.boundingBox() };
}

try {
  const learner = await db.user.findUniqueOrThrow({ where: { username } });
  const web = await db.course.findFirstOrThrow({ where: { title: 'Modern Web Development' } });
  const data = await db.course.findFirstOrThrow({ where: { title: 'Data Analysis Essentials' } });
  browser = await chromium.launch();
  const welcome = (page) => expect(page.getByRole('heading', { name: `Welcome back, ${username}.` })).toBeVisible({ timeout: 60000 });
  const centered = { x: 165, y: 246, w: 940 };
  const slides = [];
  const slide = (name, theme, ...parts) => slides.push({ name, theme, parts });

  // Learner journey
  const page = await learnerPage(learner);
  await page.goto(`${baseURL}/dashboard`);
  await welcome(page);
  await expect(page.locator('img[src*="images"]').first()).toBeVisible();
  const font = await appFont(page);
  if (!font) throw new Error('The app font was not found');
  const dashboard = await shoot(page);

  const small = await learnerPage(learner, mobile);
  await small.goto(`${baseURL}/courses/${web.id}`);
  await expect(small.getByRole('heading', { name: web.title }).first()).toBeVisible();
  if (await small.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Course page overflows at mobile width');
  const courseMobile = await shoot(small);

  slide('hero', 'green', brand(64, 52),
    copy({ x: 64, y: 118, w: 360, size: 68, pill: 'Learning platform', title: 'Learn it.<br>Track it.<br>Prove it.', text: 'Courses, team training, and certificates in one calm workspace.' }),
    win(dashboard, { x: 520, y: 92, w: 900, t: 'perspective(2200px) rotateY(-9deg) rotateX(3deg)' }),
    phone(courseMobile, { x: 446, y: 372, w: 190 }));

  await page.goto(`${baseURL}/courses`);
  await expect(page.getByRole('heading', { name: web.title, exact: true })).toBeVisible();
  const catalog = await shoot(page);
  await page.getByRole('combobox', { name: 'Sort by' }).click();
  const sortMenu = await shootElement(page.getByRole('listbox'), page);
  await page.keyboard.press('Escape');
  slide('catalog', 'cream', copy({ x: 135, y: 44, w: 1000, align: 'center', pill: 'Course catalog', title: 'Find the right course, fast', text: 'Search, filter by length, and sort a catalog built to be browsed.' }),
    win(catalog, centered), popFrom(sortMenu, centered, 1.5));

  await page.goto(`${baseURL}/courses/${web.id}`);
  await expect(page.getByRole('heading', { name: web.title }).first()).toBeVisible();
  const overview = await shoot(page);
  slide('course-overview', 'sand', copy({ x: 64, y: 190, w: 400, pill: 'Course overview', title: 'See the whole path first', text: 'Curriculum, outcomes, and your own progress on one page.' }),
    win(overview, { x: 500, y: 90, w: 900 }));

  await page.goto(`${baseURL}/courses/${web.id}/lessons/sample-web-development-3`);
  await expect(page.getByText('Add accessible interactions', { exact: true }).first()).toBeVisible();
  const lesson = await shoot(page);
  slide('lesson-workspace', 'cream', copy({ x: 846, y: 190, w: 370, pill: 'Lesson workspace', title: 'One place to focus', text: 'Read, follow the curriculum, and mark lessons complete as you go.' }),
    win(lesson, { x: 40, y: 110, w: 770 }));

  await page.goto(`${baseURL}/courses/${data.id}/certificate`);
  await expect(page.getByText('Certificate of Completion', { exact: false }).first()).toBeVisible();
  const certificate = await shoot(page);
  slide('certificate', 'green', copy({ x: 64, y: 190, w: 400, pill: 'Certificates', title: 'Finish with proof', text: 'Completed courses issue a certificate that learners can keep.' }),
    win(certificate, { x: 490, y: 110, w: 860, t: 'rotate(-2deg)' }));

  // Light, dark, and mobile
  const dark = await learnerPage(learner, { colorScheme: 'dark' });
  await dark.goto(`${baseURL}/dashboard`);
  await welcome(dark);
  const dashboardDark = await shoot(dark);
  const smallDark = await learnerPage(learner, { ...mobile, colorScheme: 'dark' });
  await smallDark.goto(`${baseURL}/dashboard`);
  await welcome(smallDark);
  if (await smallDark.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Dashboard overflows at mobile width');
  const mobileDark = await shoot(smallDark);
  slide('dark-and-mobile', 'night', copy({ x: 64, y: 190, w: 400, pill: 'Dark mode + mobile', title: 'Day, night, or on the go', text: 'One accessible theme system that follows your device.' }),
    win(dashboardDark, { x: 540, y: 80, w: 860 }, true), phone(mobileDark, { x: 468, y: 250, w: 222 }, true));

  // Organization training
  if (orgURL) {
    const org = await newPage({ ...desktop, colorScheme: 'light' });
    await org.goto(`${orgURL}/auth/signin`);
    await org.getByLabel('Username').fill('alex.morgan');
    await org.getByLabel('Password', { exact: true }).fill(process.env.PREVIEW_PASSWORD || 'local-preview-only');
    await org.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(org).not.toHaveURL(/signin/);
    await org.waitForLoadState('networkidle');
    await org.goto(`${orgURL}/organizations`);
    await org.getByRole('link').filter({ has: org.getByRole('heading', { name: 'Northstar Academy' }) }).click();

    await org.getByRole('tab', { name: 'Progress reports' }).click();
    await expect(org.getByRole('cell', { name: /alex\.morgan/ }).first()).toBeVisible();
    await expect(org.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 15000 });
    await org.evaluate(() => window.scrollTo(0, 190));
    const report = await shoot(org);
    await org.getByRole('combobox', { name: 'Status' }).click();
    const statuses = await shootElement(org.getByRole('listbox'), org);
    await org.keyboard.press('Escape');
    await org.evaluate(() => window.scrollTo(0, 0));
    slide('team-progress', 'green', copy({ x: 135, y: 44, w: 1000, align: 'center', pill: 'Team training', title: 'Know who’s on track', text: 'Deadlines, quiz scores, and certification status, filterable and exportable.' }),
      win(report, centered), popFrom(statuses, centered, 1.4));

    await org.getByRole('tab', { name: /People/ }).click();
    await expect(org.getByRole('heading', { name: 'Members', exact: true })).toBeVisible();
    const people = await shoot(org);
    await org.getByRole('combobox', { name: 'Organization role' }).click();
    const roles = await shootElement(org.getByRole('listbox'), org);
    slide('people-and-roles', 'sand', copy({ x: 64, y: 190, w: 390, pill: 'People & teams', title: 'Roles that explain themselves', text: 'Invite members, set departments, and see what each role can do.' }),
      win(people, { x: 490, y: 90, w: 900 }), popFrom(roles, { x: 490, y: 90, w: 900 }, 1.4));
  }

  if (errors.length) throw new Error([...new Set(errors)].join('\n'));
  for (const { name, theme, parts } of slides) await renderSlide(browser, font, theme, parts, `${output}${name}.jpg`);
  console.log(`Composed ${slides.length} launch slides for ${username} in docs/screenshots. Live data, image, and mobile overflow checks passed.`);
} finally {
  await browser?.close();
  await db.$disconnect();
}
