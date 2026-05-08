import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getActivityLogs } from '../controllers/activity.controller';

const router = Router();
router.use(authenticate);
router.get('/', authorize('ADMIN'), getActivityLogs);

export default router;
