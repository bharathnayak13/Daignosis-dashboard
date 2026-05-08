import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from './logger';

export const setupSocketIO = (io: Server) => {
  // Auth middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      (socket as any).userId = decoded.id;
      (socket as any).userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const role = (socket as any).userRole;
    logger.info(`Socket connected: ${userId} (${role})`);

    // Join personal room
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);

    // Appointment events
    socket.on('appointment:join-doctor-room', (doctorId: string) => {
      socket.join(`doctor:${doctorId}`);
    });

    // Queue events
    socket.on('queue:subscribe', (doctorId: string) => {
      socket.join(`queue:${doctorId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${userId}`);
    });
  });
};
