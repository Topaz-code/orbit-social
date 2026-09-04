import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller.js';
import { authenticateToken, requireAdmin, checkBanned } from '../middleware/auth.middleware.js';

const router = Router();

// Community users can file reports
router.post('/', authenticateToken, checkBanned, reportsController.createReport);

// Admin / Moderator only endpoints
router.get('/', authenticateToken, checkBanned, requireAdmin, reportsController.getReports);
router.patch('/:id', authenticateToken, checkBanned, requireAdmin, reportsController.updateReportStatus);

export default router;
