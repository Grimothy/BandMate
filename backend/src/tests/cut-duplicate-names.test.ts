/**
 * Cut Duplicate Name Tests
 *
 * Tests for creating and renaming cuts with duplicate names.
 * The backend allows duplicate names (by design - the frontend warns but permits it).
 * Covers:
 * 1. Creating cuts with duplicate names in the same vibe
 * 2. Creating cuts with duplicate names across different vibes
 * 3. Renaming a cut to a name that already exists
 * 4. Slug uniqueness is preserved even when names collide
 * 5. Case-insensitive name collisions
 */

import { describe, it, expect, beforeEach } from 'vitest';
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

describe('Cut Duplicate Names', () => {
  let adminToken: string;
  let projectId: string;
  let vibe1Id: string;
  let vibe2Id: string;

  beforeEach(async () => {
    // Clean up (order matters due to foreign keys)
    await prisma.activityRead.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.managedFile.deleteMany();
    await prisma.cut.deleteMany();
    await prisma.vibe.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    // Create admin user
    const hashedPassword = await hashPassword('adminpass123');
    await prisma.user.create({
      data: {
        email: 'admin@dupnames.test',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    });

    // Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@dupnames.test', password: 'adminpass123' });
    adminToken = loginResponse.body.accessToken;

    // Create project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Cookie', `accessToken=${adminToken}`)
      .send({ name: 'Duplicate Names Test Project' });
    projectId = projectResponse.body.id;

    // Create two vibes
    const vibe1Response = await request(app)
      .post(`/api/vibes/project/${projectId}`)
      .set('Cookie', `accessToken=${adminToken}`)
      .send({ name: 'Vibe One' });
    vibe1Id = vibe1Response.body.id;

    const vibe2Response = await request(app)
      .post(`/api/vibes/project/${projectId}`)
      .set('Cookie', `accessToken=${adminToken}`)
      .send({ name: 'Vibe Two' });
    vibe2Id = vibe2Response.body.id;
  });

  describe('Creating Cuts With Duplicate Names', () => {
    it('should allow creating two cuts with the same name in the same vibe', async () => {
      const response1 = await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'My Song' });

      expect(response1.status).toBe(201);
      expect(response1.body.name).toBe('My Song');

      const response2 = await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'My Song' });

      expect(response2.status).toBe(201);
      expect(response2.body.name).toBe('My Song');

      // Both should exist
      expect(response1.body.id).not.toBe(response2.body.id);
    });

    it('should allow creating cuts with the same name across different vibes', async () => {
      const response1 = await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Shared Name' });

      expect(response1.status).toBe(201);

      const response2 = await request(app)
        .post(`/api/cuts/vibe/${vibe2Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Shared Name' });

      expect(response2.status).toBe(201);

      expect(response1.body.vibeId).toBe(vibe1Id);
      expect(response2.body.vibeId).toBe(vibe2Id);
    });

    it('should generate unique slugs even when names are identical', async () => {
      const response1 = await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Same Name' });

      const response2 = await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Same Name' });

      expect(response1.body.slug).toBeDefined();
      expect(response2.body.slug).toBeDefined();
      expect(response1.body.slug).not.toBe(response2.body.slug);
    });

    it('should handle case-insensitive duplicate names with unique slugs', async () => {
      const response1 = await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Rock Ballad' });

      const response2 = await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'rock ballad' });

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);

      // Names are stored as provided
      expect(response1.body.name).toBe('Rock Ballad');
      expect(response2.body.name).toBe('rock ballad');

      // Slugs should be unique even though the slug generation normalizes case
      expect(response1.body.slug).not.toBe(response2.body.slug);
    });
  });

  describe('Renaming Cuts to Duplicate Names', () => {
    let cut1Id: string;
    let cut2Id: string;

    beforeEach(async () => {
      const cut1Response = await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Original Song' });
      cut1Id = cut1Response.body.id;

      const cut2Response = await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Another Song' });
      cut2Id = cut2Response.body.id;
    });

    it('should allow renaming a cut to the same name as another cut', async () => {
      const response = await request(app)
        .put(`/api/cuts/${cut2Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Original Song' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Original Song');
    });

    it('should allow renaming a cut to its own current name', async () => {
      const response = await request(app)
        .put(`/api/cuts/${cut1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Original Song' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Original Song');
    });

    it('should allow renaming a cut to a name that exists in a different vibe', async () => {
      // Create a cut in vibe 2
      const vibe2CutResponse = await request(app)
        .post(`/api/cuts/vibe/${vibe2Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Vibe Two Song' });
      const vibe2CutId = vibe2CutResponse.body.id;

      // Rename cut in vibe 1 to the same name as the cut in vibe 2
      const response = await request(app)
        .put(`/api/cuts/${cut1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Vibe Two Song' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Vibe Two Song');

      // Both cuts should still exist independently
      const vibe2Cut = await request(app)
        .get(`/api/cuts/${vibe2CutId}`)
        .set('Cookie', `accessToken=${adminToken}`);

      expect(vibe2Cut.status).toBe(200);
      expect(vibe2Cut.body.name).toBe('Vibe Two Song');
    });

    it('should preserve other metadata when renaming', async () => {
      // Create a cut with metadata
      const metaCutResponse = await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Meta Song', bpm: 140, timeSignature: '3/4' });
      const metaCutId = metaCutResponse.body.id;

      // Rename it
      const response = await request(app)
        .put(`/api/cuts/${metaCutId}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Renamed Meta Song' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Renamed Meta Song');

      // Fetch to verify metadata survived
      const fetchResponse = await request(app)
        .get(`/api/cuts/${metaCutId}`)
        .set('Cookie', `accessToken=${adminToken}`);

      expect(fetchResponse.body.bpm).toBe(140);
      expect(fetchResponse.body.timeSignature).toBe('3/4');
    });

    it('should not change the slug when renaming a cut', async () => {
      // Get the original slug
      const originalResponse = await request(app)
        .get(`/api/cuts/${cut1Id}`)
        .set('Cookie', `accessToken=${adminToken}`);
      const originalSlug = originalResponse.body.slug;

      // Rename the cut
      const response = await request(app)
        .put(`/api/cuts/${cut1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Completely Different Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Completely Different Name');

      // Slug should be unchanged
      const updatedResponse = await request(app)
        .get(`/api/cuts/${cut1Id}`)
        .set('Cookie', `accessToken=${adminToken}`);
      expect(updatedResponse.body.slug).toBe(originalSlug);
    });
  });

  describe('Listing Cuts With Duplicate Names', () => {
    it('should return all cuts including those with duplicate names', async () => {
      await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Duplicate' });

      await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Duplicate' });

      await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Unique' });

      const response = await request(app)
        .get(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);

      const names = response.body.map((c: any) => c.name);
      expect(names.filter((n: string) => n === 'Duplicate')).toHaveLength(2);
      expect(names.filter((n: string) => n === 'Unique')).toHaveLength(1);
    });

    it('should return duplicate-named cuts across vibes in a project', async () => {
      await request(app)
        .post(`/api/cuts/vibe/${vibe1Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Cross Vibe Song' });

      await request(app)
        .post(`/api/cuts/vibe/${vibe2Id}`)
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ name: 'Cross Vibe Song' });

      // Fetch the project to see all vibes and cuts
      const projectResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Cookie', `accessToken=${adminToken}`);

      expect(projectResponse.status).toBe(200);

      const allCutNames: string[] = [];
      for (const vibe of projectResponse.body.vibes) {
        for (const cut of vibe.cuts) {
          allCutNames.push(cut.name);
        }
      }

      expect(allCutNames.filter(n => n === 'Cross Vibe Song')).toHaveLength(2);
    });
  });
});
