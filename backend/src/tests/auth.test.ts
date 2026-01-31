import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import routes from '../routes';
import { prisma } from './setup';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api', routes);

describe('Auth Routes', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  };

  beforeEach(async () => {
    // Clean users before each test
    await prisma.refreshToken.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      // Register first user
      await request(app).post('/api/auth/register').send(testUser);
      
      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Register user first
      await request(app).post('/api/auth/register').send(testUser);
      
      // Login
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      
      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should reject invalid password', async () => {
      // Register user first
      await request(app).post('/api/auth/register').send(testUser);
      
      // Login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });
      
      expect(response.status).toBe(401);
    });
  });
});
