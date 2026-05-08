import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import {
  getLabTests,
  getLabTest,
  createLabTest,
  updateLabTest,
  updateTestStatus,
  collectSample,
  generateReport,
  getLabStats,
} from '../controllers/labTest.controller';

const router = Router();

router.use(authenticate);

router.get('/', getLabTests);
router.get('/stats', authorize('ADMIN', 'LAB_TECHNICIAN'), getLabStats);
router.get('/:id', getLabTest);

router.post('/', authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), [
  body('patientId').isUUID(),
  body('testName').notEmpty(),
  body('category').notEmpty(),
], createLabTest);

router.put('/:id', authorize('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN'), updateLabTest);
router.put('/:id/status', authorize('ADMIN', 'LAB_TECHNICIAN'), updateTestStatus);
router.put('/:id/collect-sample', authorize('ADMIN', 'LAB_TECHNICIAN'), collectSample);
router.post('/:id/generate-report', authorize('ADMIN', 'LAB_TECHNICIAN'), generateReport);

export default router;
