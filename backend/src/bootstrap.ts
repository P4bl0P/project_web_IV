import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
const prisma = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase(); const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 15) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD (minimum 15 characters) are required');
  if (await prisma.user.count({ where: { isSuperAdmin: true } })) throw new Error('The absolute administrator already exists');
  await prisma.user.create({ data: { email, name: process.env.ADMIN_NAME ?? 'Administrador', passwordHash: await argon2.hash(password), isSuperAdmin: true, status: 'ACTIVE' } });
}
void main().finally(() => prisma.$disconnect());
