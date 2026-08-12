import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUpNote,
  customerSchema,
  followUpNoteSchema,
} from '../controllers/customerController.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);

router.post(
  '/',
  requireRole(['ADMIN', 'SALES']),
  validateRequest(customerSchema),
  createCustomer
);

router.put(
  '/:id',
  requireRole(['ADMIN', 'SALES']),
  validateRequest(customerSchema.partial()),
  updateCustomer
);

router.post(
  '/:id/notes',
  requireRole(['ADMIN', 'SALES']),
  validateRequest(followUpNoteSchema),
  addFollowUpNote
);

export default router;
