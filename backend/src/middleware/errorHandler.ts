import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Prisma errors
  if ((err as any).code === 'P2002') {
    res.status(409).json({
      status: 'error',
      message: 'A record with this value already exists.',
    });
    return;
  }

  if ((err as any).code === 'P2025') {
    res.status(404).json({
      status: 'error',
      message: 'Record not found.',
    });
    return;
  }

  // Default 500
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message,
  });
};
