import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getSettings, updateSetting } from '../controllers/settings.controller';

const router = Router();
router.use(authenticate);
router.get('/', getSettings);
router.put('/:key', authorize('ADMIN'), updateSetting);

export default router;
