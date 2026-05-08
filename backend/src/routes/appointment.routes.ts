import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getQueue,
  updateQueue,
  getDoctorSchedule,
  getCalendarView,
} from '../controllers/appointment.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAppointments);
router.get('/queue', getQueue);
router.get('/calendar', getCalendarView);
router.get('/doctor/:doctorId/schedule', getDoctorSchedule);
router.get('/:id', getAppointment);

router.post('/', [
  body('patientId').isUUID(),
  body('doctorId').isUUID(),
  body('scheduledAt').isISO8601(),
  body('type').optional().isString(),
  body('notes').optional().isString(),
], createAppointment);

router.put('/:id', updateAppointment);
router.put('/:id/queue', authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), updateQueue);
router.delete('/:id', cancelAppointment);

export default router;
