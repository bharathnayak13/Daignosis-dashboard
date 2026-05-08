import { Request } from 'express';
import { prisma } from './prisma';
import { logger } from './logger';

export const logActivity = async (
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  description?: string,
  req?: Request,
  metadata?: any
) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        description,
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent'],
        metadata,
      },
    });
  } catch (error) {
    logger.error('Failed to log activity:', error);
  }
};
