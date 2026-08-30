import { Router } from 'express';
import { messagesController } from '../controllers/messages.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.delete('/:id', authenticateToken, messagesController.deleteMessage);

export default router;
