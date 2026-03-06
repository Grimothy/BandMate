import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import routes from '../routes';
import { prisma } from './setup';
import { hashPassword } from '../utils/password';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api', routes);

describe('Admin Test Email Route', () => {
  let adminToken: string;
  let memberToken: string;

  beforeEach(async () => {
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

    await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: await hashPassword('adminpass123'),
        name: 'Admin User',
        role: 'ADMIN',
      },
    });

    await prisma.user.create({
      data: {
        email: 'member@test.com',
        password: await hashPassword('memberpass123'),
        name: 'Member User',
        role: 'MEMBER',
      },
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'adminpass123' });
    adminToken = adminLogin.body.accessToken;

    const memberLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@test.com', password: 'memberpass123' });
    memberToken = memberLogin.body.accessToken;
  });

  it('allows admin to trigger test email', async () => {
    const response = await request(app)
      .post('/api/users/test-email')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        to: 'receiver@example.com',
        subject: 'Admin test',
        message: 'Testing SMTP',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('sent');
    expect(response.body.recipient).toBe('receiver@example.com');
  });

  it('rejects member access', async () => {
    const response = await request(app)
      .post('/api/users/test-email')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ to: 'receiver@example.com' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Admin access required');
  });

  it('validates recipient email format', async () => {
    const response = await request(app)
      .post('/api/users/test-email')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ to: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid recipient email');
  });
});
