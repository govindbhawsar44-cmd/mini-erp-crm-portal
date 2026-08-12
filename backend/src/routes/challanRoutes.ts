import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
  challanSchema,
  updateStatusSchema,
} from '../controllers/challanController.js';
import { exportChallanPDF } from '../controllers/pdfController.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', getChallans);
router.get('/:id', getChallanById);
router.get('/:id/pdf', exportChallanPDF);

router.post(
  '/',
  requireRole(['ADMIN', 'SALES']),
  validateRequest(challanSchema),
  createChallan
);

router.put(
  '/:id/status',
  requireRole(['ADMIN', 'SALES', 'ACCOUNTS']),
  validateRequest(updateStatusSchema),
  updateChallanStatus
);

export default router;
