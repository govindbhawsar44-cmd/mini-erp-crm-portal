import { Router } from 'express';
import { getDashboardMetrics } from '../controllers/dashboardController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.get('/metrics', authenticateJWT, getDashboardMetrics);

export default router;
