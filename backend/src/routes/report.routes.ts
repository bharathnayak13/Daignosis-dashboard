import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getReports, getReport, deleteReport } from '../controllers/report.controller';

const router = Router();
router.use(authenticate);
router.get('/', getReports);
router.get('/:id', getReport);
router.delete('/:id', authorize('ADMIN'), deleteReport);

export default router;
