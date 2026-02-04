import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getActivitiesForUser } from '../services/activities';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/activities
 * Get recent activities for projects the current user is a member of
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const activities = await getActivitiesForUser(userId, { limit, offset });
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

export default router;
