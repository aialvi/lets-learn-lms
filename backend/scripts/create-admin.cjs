// Explicit, operator-run bootstrap; never creates a default account at startup.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const db = new PrismaClient();
async function main() {
  const { ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_USERNAME || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) throw new Error('Set ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD (at least 12 characters).');
  const existing = await db.user.findFirst({ where: { OR: [{ email: ADMIN_EMAIL.toLowerCase() }, { username: ADMIN_USERNAME }] } });
  if (existing) throw new Error('Account already exists; bootstrap will not overwrite its credentials or privileges.');
  await db.user.create({ data: { email: ADMIN_EMAIL.toLowerCase(), username: ADMIN_USERNAME, password: await bcrypt.hash(ADMIN_PASSWORD, 12), role: 'admin', memberships: { create: { organizationId: 'default-academic', role: 'admin' } } } });
  console.log('Platform administrator created.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
