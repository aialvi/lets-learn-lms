import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Start backend's preview:organizations and the frontend before running this.
const output = fileURLToPath(new URL('../../docs/screenshots/', import.meta.url));
await mkdir(output, { recursive: true });
const baseURL = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1040 }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'en-US', timezoneId: 'Asia/Dhaka' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const capture = async (name, fullPage = false) => {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${output}${name}.png`, fullPage, animations: 'disabled' });
};
try {
  await page.goto(`${baseURL}/auth/signin?callbackUrl=/organizations`);
  await page.getByLabel('Username').fill('alex.morgan');
  await page.getByLabel('Password', { exact: true }).fill(process.env.PREVIEW_PASSWORD || 'local-preview-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/organizations$/);
  await expect(page.getByRole('heading', { name: 'Northstar Academy' })).toBeVisible();
  // Wait for transient auth confirmation toasts to dismiss before capture.
  await page.locator('[data-sonner-toast]').waitFor({ state: 'hidden' }).catch(() => {});
  await capture('organization-workspaces');
  await page.getByRole('link').filter({ has: page.getByRole('heading', { name: 'Northstar Academy' }) }).click();
  await expect(page.getByRole('heading', { name: 'Build skills. Stay ready.' })).toBeVisible();
  const workspaceURL = page.url();
  await capture('professional-dashboard');
  await page.getByRole('button', { name: 'Progress reports', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Employee progress' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'alex.morgan', exact: true }).first()).toBeVisible();
  await capture('employee-progress');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  if (await download.failure()) throw new Error('CSV export failed');
  await page.getByRole('button', { name: 'People & teams', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Members', exact: true })).toBeVisible();
  await capture('people-and-teams');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Workspace settings' })).toBeVisible();
  await capture('module-settings');
  await page.getByRole('button', { name: 'Course catalog', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Workplace safety essentials', exact: true })).toBeVisible();
  await capture('course-catalog');
  await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Workplace safety essentials', exact: true }) }).getByRole('button', { name: 'Edit course' }).click();
  await expect(page.getByRole('heading', { name: 'Course quiz', exact: true })).toBeVisible();
  await page.getByRole('heading', { name: 'Course quiz', exact: true }).scrollIntoViewIfNeeded();
  await capture('quiz-editor');
  await page.getByRole('button', { name: 'Certifications', exact: true }).click();
  await page.getByRole('link', { name: 'View certificate' }).first().click();
  await expect(page.getByRole('heading', { name: 'Certificate of Completion' })).toBeVisible();
  await capture('completion-certificate');
  // Check the same workspace at phone width, including overflow and accessible navigation.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(workspaceURL);
  await expect(page.getByRole('heading', { name: 'Build skills. Stay ready.' })).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (hasOverflow) throw new Error('Workspace overflows the mobile viewport');
  await capture('mobile-training', true);
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
  console.log(`Captured nine screenshots in ${output}. Desktop, mobile, certificate, and CSV checks passed.`);
} finally { await browser.close(); }
