import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getDoctors, getDoctor, updateDoctor, getDoctorAvailability } from '../controllers/doctor.controller';

const router = Router();
router.use(authenticate);
router.get('/', getDoctors);
router.get('/:id', getDoctor);
router.get('/:id/availability', getDoctorAvailability);
router.put('/:id', authorize('ADMIN', 'DOCTOR'), updateDoctor);

export default router;
