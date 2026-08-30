import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, notificationsController.getNotifications);
router.put('/read-all', authenticateToken, notificationsController.markAllAsRead);
router.put('/:id/read', authenticateToken, notificationsController.markAsRead);
router.delete('/:id', authenticateToken, notificationsController.deleteNotification);

export default router;
