import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { hashPassword } from '../utils/password';
import prisma from '../lib/prisma';
import { sendNotificationEmail } from '../services/email';
import { config } from '../config/env';
import { manuallyTriggerAllDigests } from '../services/digests';

const router = Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Send test email (admin only)
router.post('/test-email', async (req: AuthRequest, res: Response) => {
  try {
    const { to, subject, message } = req.body ?? {};

    const recipient = typeof to === 'string' && to.trim().length > 0
      ? to.trim()
      : req.user?.email;

    if (!recipient) {
      res.status(400).json({ error: 'Recipient email is required' });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(recipient)) {
      res.status(400).json({ error: 'Invalid recipient email' });
      return;
    }

    const finalSubject = typeof subject === 'string' && subject.trim().length > 0
      ? subject.trim()
      : 'BandMate Admin Email Test';

    const finalMessage = typeof message === 'string' && message.trim().length > 0
      ? message.trim()
      : 'This is a test email sent from the BandMate admin endpoint. If you received this, SMTP is configured correctly.';

    const sent = await sendNotificationEmail(
      recipient,
      finalSubject,
      `${finalMessage}\n\nSent by: ${req.user?.name || 'Admin'} (${req.user?.email || 'unknown'})`,
      '/projects'
    );

    res.json({
      message: sent ? 'Test email sent' : 'Email sending disabled or failed',
      sent,
      recipient,
      emailEnabled: config.email.enabled,
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Manually trigger all digest emails (admin only)
router.post('/trigger-digests', async (req: AuthRequest, res: Response) => {
  try {
    const result = await manuallyTriggerAllDigests();

    res.json({
      message: `Processed ${result.processed} digest(s)`,
      ...result,
    });
  } catch (error) {
    console.error('Manual digest trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger digests' });
  }
});

// List all users
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Get single user
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        projects: {
          include: {
            project: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Create user
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      res.status(400).json({ error: 'A user with this email already exists' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check email uniqueness if changing email
    if (email && email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        res.status(400).json({ error: 'Email is already in use' });
        return;
      }
    }

    const updateData: Record<string, unknown> = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
    if (password) updateData.password = await hashPassword(password);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;

    // Prevent self-deletion
    if (req.user?.id === userId) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
