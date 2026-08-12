import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  getStockMovements,
  productSchema,
  stockAdjustSchema,
} from '../controllers/productController.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', getProducts);
router.get('/stock-logs/all', getStockMovements);
router.get('/:id', getProductById);

router.post(
  '/',
  requireRole(['ADMIN', 'WAREHOUSE']),
  validateRequest(productSchema),
  createProduct
);

router.put(
  '/:id',
  requireRole(['ADMIN', 'WAREHOUSE']),
  validateRequest(productSchema.partial()),
  updateProduct
);

router.post(
  '/:id/stock',
  requireRole(['ADMIN', 'WAREHOUSE']),
  validateRequest(stockAdjustSchema),
  adjustStock
);

export default router;
