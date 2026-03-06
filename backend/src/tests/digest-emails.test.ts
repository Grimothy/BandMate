import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import routes from '../routes';
import { prisma } from './setup';
import { hashPassword } from '../utils/password';
import { processProjectDigestConfig } from '../services/digests';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api', routes);

describe('Project Digest Emails', () => {
  let adminToken: string;
  let member1Token: string;
  let member2Token: string;

  let adminId: string;
  let member1Id: string;
  let member2Id: string;
  let projectId: string;

  beforeEach(async () => {
    await prisma.digestItem.deleteMany();
    await prisma.digestRun.deleteMany();
    await prisma.projectMemberDigestPreference.deleteMany();
    await prisma.projectDigestConfig.deleteMany();
    await prisma.activityRead.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const admin = await prisma.user.create({
      data: {
        email: 'digest-admin@test.com',
        password: await hashPassword('adminpass123'),
        name: 'Digest Admin',
        role: 'ADMIN',
      },
    });

    const member1 = await prisma.user.create({
      data: {
        email: 'digest-member1@test.com',
        password: await hashPassword('member1pass123'),
        name: 'Digest Member One',
        role: 'MEMBER',
      },
    });

    const member2 = await prisma.user.create({
      data: {
        email: 'digest-member2@test.com',
        password: await hashPassword('member2pass123'),
        name: 'Digest Member Two',
        role: 'MEMBER',
      },
    });

    adminId = admin.id;
    member1Id = member1.id;
    member2Id = member2.id;

    const project = await prisma.project.create({
      data: {
        name: 'Digest Project',
        slug: 'digest-project',
      },
    });
    projectId = project.id;

    await prisma.projectMember.createMany({
      data: [
        { userId: adminId, projectId, canCreateVibes: true },
        { userId: member1Id, projectId, canCreateVibes: true },
        { userId: member2Id, projectId, canCreateVibes: true },
      ],
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'digest-admin@test.com', password: 'adminpass123' });
    adminToken = adminLogin.body.accessToken;

    const member1Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'digest-member1@test.com', password: 'member1pass123' });
    member1Token = member1Login.body.accessToken;

    const member2Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'digest-member2@test.com', password: 'member2pass123' });
    member2Token = member2Login.body.accessToken;
  });

  it('allows admin to configure project digest settings and blocks members', async () => {
    const memberResponse = await request(app)
      .put(`/api/projects/${projectId}/digest-settings`)
      .set('Cookie', `accessToken=${member1Token}`)
      .send({ enabled: true, frequencyMinutes: 60 });

    expect(memberResponse.status).toBe(403);

    const adminResponse = await request(app)
      .put(`/api/projects/${projectId}/digest-settings`)
      .set('Cookie', `accessToken=${adminToken}`)
      .send({ enabled: true, frequencyMinutes: 60 });

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.enabled).toBe(true);
    expect(adminResponse.body.frequencyMinutes).toBe(60);
  });

  it('supports member digest opt-out preference endpoint', async () => {
    const response = await request(app)
      .put(`/api/projects/${projectId}/digest-preference/me`)
      .set('Cookie', `accessToken=${member2Token}`)
      .send({ optedOut: true });

    expect(response.status).toBe(200);
    expect(response.body.optedOut).toBe(true);

    const stored = await prisma.projectMemberDigestPreference.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: member2Id,
        },
      },
    });

    expect(stored?.optedOut).toBe(true);
  });

  it('excludes actor activities and prevents duplicate digest items across reruns', async () => {
    const createdAt = new Date(Date.now() - 60 * 60 * 1000);

    const activity = await prisma.activity.create({
      data: {
        type: 'cut_created',
        userId: member1Id,
        projectId,
        metadata: JSON.stringify({ cutName: 'Song A' }),
        resourceLink: '/cuts/abc123',
        createdAt,
      },
    });

    const config = await prisma.projectDigestConfig.create({
      data: {
        projectId,
        enabled: true,
        frequencyMinutes: 1440,
        lastRunAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        nextRunAt: new Date(Date.now() - 60 * 1000),
      },
    });

    await processProjectDigestConfig(config.id);

    const firstRunItems = await prisma.digestItem.findMany({
      where: {
        projectId,
        activityId: activity.id,
      },
      select: { recipientId: true },
    });

    const firstRecipients = firstRunItems.map((item) => item.recipientId);
    expect(firstRecipients).toContain(adminId);
    expect(firstRecipients).toContain(member2Id);
    expect(firstRecipients).not.toContain(member1Id);

    await prisma.projectDigestConfig.update({
      where: { id: config.id },
      data: {
        lastRunAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        nextRunAt: new Date(Date.now() - 60 * 1000),
      },
    });

    await processProjectDigestConfig(config.id);

    const secondRunItems = await prisma.digestItem.findMany({
      where: {
        projectId,
        activityId: activity.id,
      },
      select: { recipientId: true },
    });

    expect(secondRunItems.length).toBe(firstRunItems.length);
  });

  it('honors member opt-out when building digest recipients', async () => {
    await prisma.projectMemberDigestPreference.create({
      data: {
        projectId,
        userId: member2Id,
        optedOut: true,
      },
    });

    const activity = await prisma.activity.create({
      data: {
        type: 'file_uploaded',
        userId: adminId,
        projectId,
        metadata: JSON.stringify({ filename: 'take-1.wav' }),
        resourceLink: '/projects/test',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    });

    const config = await prisma.projectDigestConfig.create({
      data: {
        projectId,
        enabled: true,
        frequencyMinutes: 60,
        lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        nextRunAt: new Date(Date.now() - 60 * 1000),
      },
    });

    await processProjectDigestConfig(config.id);

    const items = await prisma.digestItem.findMany({
      where: {
        projectId,
        activityId: activity.id,
      },
      select: { recipientId: true },
    });

    const recipients = items.map((item) => item.recipientId);
    expect(recipients).toContain(member1Id);
    expect(recipients).not.toContain(member2Id);
  });
});
