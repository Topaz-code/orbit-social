import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticateToken, requireAdmin, checkBanned } from '../middleware/auth.middleware.js';

const router = Router();

// All admin routes strictly require authentication, ban check, and admin/moderator role
router.use(authenticateToken, checkBanned, requireAdmin);

router.get('/metrics', adminController.getMetrics);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/ban', adminController.moderateUser);
router.patch('/users/:id/role', adminController.updateUserRole);
router.post('/content/:type/:id/action', adminController.moderateContent);
router.get('/logs', adminController.getLogs);

export default router;
