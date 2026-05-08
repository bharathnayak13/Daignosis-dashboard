import 'express-async-errors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { setupRoutes } from './routes';
import { setupSocketIO } from './utils/socket';
import { prisma } from './utils/prisma';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { error: 'Too many requests, please try again later.' },
});


// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Attach io to requests
app.use((req: any, _res, next) => {
  req.io = io;
  next();
});

// Routes
setupRoutes(app);

// Error handler
app.use(errorHandler);

// Socket.IO
setupSocketIO(io);

const PORT = process.env.PORT || 5000;

async function main() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  logger.info('Server shut down gracefully');
  process.exit(0);
});

export { io };
