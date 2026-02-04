import { PrismaClient, Activity } from '@prisma/client';
import { emitToProject } from './socket';

const prisma = new PrismaClient();

export type ActivityType = 
  | 'file_uploaded' 
  | 'cut_created' 
  | 'vibe_created' 
  | 'member_added' 
  | 'comment_added';

export interface CreateActivityOptions {
  type: ActivityType;
  userId: string;
  projectId: string;
  metadata?: Record<string, any>;
  resourceLink?: string;
}

export interface ActivityWithUser extends Activity {
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

/**
 * Create an activity entry and broadcast it
 */
export async function createActivity(
  options: CreateActivityOptions
): Promise<Activity> {
  const { type, userId, projectId, metadata, resourceLink } = options;

  const activity = await prisma.activity.create({
    data: {
      type,
      userId,
      projectId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      resourceLink,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Broadcast activity to project members via WebSocket
  emitToProject(projectId, 'activity', activity);

  console.log(`[Activity] Created activity ${type} by user ${userId} in project ${projectId}`);
  return activity;
}

/**
 * Get recent activities for projects the user has access to
 */
export async function getActivitiesForUser(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<ActivityWithUser[]> {
  const { limit = 20, offset = 0 } = options;

  // Get all projects the user is a member of
  const projectMembers = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });

  const projectIds = projectMembers.map(pm => pm.projectId);

  if (projectIds.length === 0) {
    return [];
  }

  // Fetch activities from those projects
  const activities = await prisma.activity.findMany({
    where: {
      projectId: { in: projectIds },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return activities as ActivityWithUser[];
}

/**
 * Get activities for a specific project
 */
export async function getActivitiesForProject(
  projectId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<ActivityWithUser[]> {
  const { limit = 20, offset = 0 } = options;

  const activities = await prisma.activity.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return activities as ActivityWithUser[];
}

/**
 * Clean up old activities (maintenance job)
 */
export async function cleanupOldActivities(daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.activity.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  console.log(`[Activity] Cleaned up ${result.count} old activities`);
  return result.count;
}
