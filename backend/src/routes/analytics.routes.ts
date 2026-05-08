import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getDashboardStats,
  getPatientAnalytics,
  getRevenueAnalytics,
  getLabAnalytics,
  getDoctorWorkload,
  getMonthlyReport,
} from '../controllers/analytics.controller';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST'));

router.get('/dashboard', getDashboardStats);
router.get('/patients', getPatientAnalytics);
router.get('/revenue', getRevenueAnalytics);
router.get('/lab', getLabAnalytics);
router.get('/doctors', getDoctorWorkload);
router.get('/monthly', getMonthlyReport);

export default router;
