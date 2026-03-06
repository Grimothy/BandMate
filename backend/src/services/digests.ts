import prisma from '../lib/prisma';
import { sendProjectDigestEmail } from './email';

export const ALLOWED_DIGEST_FREQUENCIES = [15, 30, 60, 180, 360, 720, 1440, 10080] as const;
export const DEFAULT_DIGEST_FREQUENCY_MINUTES = 1440;

interface DigestRecipient {
  id: string;
  name: string;
  email: string;
}

function getWindowStart(lastRunAt: Date | null, frequencyMinutes: number, windowEnd: Date): Date {
  if (lastRunAt) {
    return lastRunAt;
  }

  return new Date(windowEnd.getTime() - frequencyMinutes * 60 * 1000);
}

function getNextRunAt(windowEnd: Date, frequencyMinutes: number): Date {
  return new Date(windowEnd.getTime() + frequencyMinutes * 60 * 1000);
}

async function reserveDigestItems(
  digestRunId: string,
  projectId: string,
  recipientId: string,
  activityIds: string[]
): Promise<string[]> {
  if (activityIds.length === 0) {
    return [];
  }

  const existingItems = await prisma.digestItem.findMany({
    where: {
      recipientId,
      projectId,
      activityId: { in: activityIds },
    },
    select: {
      activityId: true,
    },
  });

  const existingIds = new Set(existingItems.map((item) => item.activityId));
  const newActivityIds = activityIds.filter((activityId) => !existingIds.has(activityId));

  if (newActivityIds.length > 0) {
    await prisma.digestItem.createMany({
      data: newActivityIds.map((activityId) => ({
        digestRunId,
        recipientId,
        projectId,
        activityId,
      })),
    });
  }

  return newActivityIds;
}

async function getProjectRecipients(projectId: string): Promise<DigestRecipient[]> {
  const [members, preferences] = await Promise.all([
    prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.projectMemberDigestPreference.findMany({
      where: {
        projectId,
        optedOut: true,
      },
      select: { userId: true },
    }),
  ]);

  const optedOutIds = new Set(preferences.map((p) => p.userId));

  return members
    .filter((member) => !optedOutIds.has(member.userId))
    .map((member) => member.user);
}

export async function processProjectDigestConfig(configId: string): Promise<{ projectId: string; deliveredCount: number; recipientCount: number; } | null> {
  const digestConfig = await prisma.projectDigestConfig.findUnique({
    where: { id: configId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
        },
      },
    },
  });

  if (!digestConfig || !digestConfig.enabled) {
    return null;
  }

  const windowEnd = new Date();
  const windowStart = getWindowStart(digestConfig.lastRunAt, digestConfig.frequencyMinutes, windowEnd);

  const run = await prisma.digestRun.create({
    data: {
      projectId: digestConfig.projectId,
      windowStart,
      windowEnd,
      status: 'RUNNING',
    },
  });

  try {
    const [activities, recipients] = await Promise.all([
      prisma.activity.findMany({
        where: {
          projectId: digestConfig.projectId,
          createdAt: {
            gt: windowStart,
            lte: windowEnd,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      getProjectRecipients(digestConfig.projectId),
    ]);

    let deliveredCount = 0;
    let recipientCount = 0;

    for (const recipient of recipients) {
      const recipientActivities = activities.filter((activity) => activity.userId !== recipient.id);
      if (recipientActivities.length === 0) {
        continue;
      }

      const reservedActivityIds = await reserveDigestItems(
        run.id,
        digestConfig.projectId,
        recipient.id,
        recipientActivities.map((activity) => activity.id)
      );

      if (reservedActivityIds.length === 0) {
        continue;
      }

      const reservedSet = new Set(reservedActivityIds);
      const digestActivities = recipientActivities
        .filter((activity) => reservedSet.has(activity.id))
        .map((activity) => ({
          actorName: activity.user.name,
          type: activity.type,
          createdAt: activity.createdAt,
          resourceLink: activity.resourceLink,
          metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
        }));

      const sent = await sendProjectDigestEmail(
        recipient.email,
        recipient.name,
        digestConfig.project.name,
        digestActivities,
        digestConfig.project.slug,
        digestConfig.project.image
      );

      if (sent) {
        recipientCount += 1;
        deliveredCount += digestActivities.length;
      }
    }

    await prisma.$transaction([
      prisma.digestRun.update({
        where: { id: run.id },
        data: {
          status: 'COMPLETED',
          candidateCount: activities.length,
          deliveredItemCount: deliveredCount,
          recipientCount,
        },
      }),
      prisma.projectDigestConfig.update({
        where: { id: digestConfig.id },
        data: {
          lastRunAt: windowEnd,
          nextRunAt: getNextRunAt(windowEnd, digestConfig.frequencyMinutes),
        },
      }),
    ]);

    return {
      projectId: digestConfig.projectId,
      deliveredCount,
      recipientCount,
    };
  } catch (error: any) {
    await prisma.digestRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        error: error?.message ?? 'Digest processing failed',
      },
    });

    throw error;
  }
}

export async function processDueProjectDigests(): Promise<number> {
  const now = new Date();

  const dueConfigs = await prisma.projectDigestConfig.findMany({
    where: {
      enabled: true,
      OR: [
        { nextRunAt: null },
        { nextRunAt: { lte: now } },
      ],
    },
    select: { id: true },
  });

  for (const digestConfig of dueConfigs) {
    try {
      await processProjectDigestConfig(digestConfig.id);
    } catch (error) {
      console.error(`[Digest] Failed processing digest config ${digestConfig.id}:`, error);
    }
  }

  return dueConfigs.length;
}

/**
 * Manually trigger digest processing for all enabled projects (admin-initiated)
 * Ignores schedule and processes immediately
 */
export async function manuallyTriggerAllDigests(): Promise<{
  processed: number;
  failed: number;
  totalRecipients: number;
  totalItems: number;
}> {
  const allEnabledConfigs = await prisma.projectDigestConfig.findMany({
    where: { enabled: true },
    select: { id: true },
  });

  let processed = 0;
  let failed = 0;
  let totalRecipients = 0;
  let totalItems = 0;

  for (const digestConfig of allEnabledConfigs) {
    try {
      const result = await processProjectDigestConfig(digestConfig.id);
      if (result) {
        processed += 1;
        totalRecipients += result.recipientCount;
        totalItems += result.deliveredCount;
      }
    } catch (error) {
      console.error(`[Digest] Manual trigger failed for config ${digestConfig.id}:`, error);
      failed += 1;
    }
  }

  return {
    processed,
    failed,
    totalRecipients,
    totalItems,
  };
}

export async function getOrCreateProjectDigestConfig(projectId: string) {
  return prisma.projectDigestConfig.upsert({
    where: { projectId },
    update: {},
    create: {
      projectId,
      enabled: false,
      frequencyMinutes: DEFAULT_DIGEST_FREQUENCY_MINUTES,
      nextRunAt: null,
    },
  });
}

export async function updateProjectDigestConfig(
  projectId: string,
  input: { enabled?: boolean; frequencyMinutes?: number }
) {
  const current = await getOrCreateProjectDigestConfig(projectId);
  const now = new Date();

  const frequencyMinutes = input.frequencyMinutes ?? current.frequencyMinutes;
  const enabled = input.enabled ?? current.enabled;

  const nextRunAt = enabled
    ? new Date(now.getTime() + frequencyMinutes * 60 * 1000)
    : null;

  return prisma.projectDigestConfig.update({
    where: { projectId },
    data: {
      enabled,
      frequencyMinutes,
      nextRunAt,
    },
  });
}

export async function setProjectMemberDigestOptOut(projectId: string, userId: string, optedOut: boolean) {
  return prisma.projectMemberDigestPreference.upsert({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    update: {
      optedOut,
    },
    create: {
      projectId,
      userId,
      optedOut,
    },
  });
}

export async function getProjectMemberDigestPreference(projectId: string, userId: string) {
  const preference = await prisma.projectMemberDigestPreference.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  return {
    optedOut: preference?.optedOut ?? false,
  };
}
