import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Clean database before tests (order matters due to foreign keys)
  await prisma.digestItem.deleteMany();
  await prisma.digestRun.deleteMany();
  await prisma.projectMemberDigestPreference.deleteMany();
  await prisma.projectDigestConfig.deleteMany();
  await prisma.activityRead.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.managedFile.deleteMany();
  await prisma.cut.deleteMany();
  await prisma.vibe.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
