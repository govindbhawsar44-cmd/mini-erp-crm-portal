import { Router } from 'express';
import { login, getMe, loginSchema } from '../controllers/authController.js';
import { validateRequest } from '../middleware/validate.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);
router.get('/me', authenticateJWT, getMe);

export default router;
