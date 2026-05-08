import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getInvoices, getInvoice, createInvoice, updateInvoice, generateInvoicePDF, markAsPaid
} from '../controllers/invoice.controller';

const router = Router();
router.use(authenticate);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.get('/:id/pdf', generateInvoicePDF);
router.post('/', authorize('ADMIN', 'RECEPTIONIST'), createInvoice);
router.put('/:id', authorize('ADMIN', 'RECEPTIONIST'), updateInvoice);
router.put('/:id/pay', authorize('ADMIN', 'RECEPTIONIST'), markAsPaid);

export default router;
