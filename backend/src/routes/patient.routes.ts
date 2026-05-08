import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients,
  getPatientHistory,
  addMedicalHistory,
} from '../controllers/patient.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'LAB_TECHNICIAN'), getPatients);
router.get('/search', authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'LAB_TECHNICIAN'), searchPatients);
router.get('/:id', getPatient);
router.get('/:id/history', getPatientHistory);

router.post('/', authorize('ADMIN', 'RECEPTIONIST'), [
  body('userId').optional().isUUID(),
  body('dateOfBirth').isISO8601(),
  body('gender').isIn(['MALE', 'FEMALE', 'OTHER']),
], createPatient);

router.put('/:id', authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), updatePatient);
router.delete('/:id', authorize('ADMIN'), deletePatient);
router.post('/:id/history', authorize('ADMIN', 'DOCTOR'), addMedicalHistory);

export default router;
