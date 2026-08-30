import { Router } from 'express';
import { conversationsController } from '../controllers/conversations.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import {
  createConversationSchema,
  sendMessageSchema,
} from '../validators/conversations.validator.js';

const router = Router();

router.get('/', authenticateToken, conversationsController.getConversations);
router.post('/', authenticateToken, validateBody(createConversationSchema), conversationsController.createConversation);
router.get('/:id', authenticateToken, conversationsController.getConversationById);
router.put('/:id/read', authenticateToken, conversationsController.markAsRead);
router.get('/:id/messages', authenticateToken, conversationsController.getMessages);
router.post('/:id/messages', authenticateToken, validateBody(sendMessageSchema), conversationsController.sendMessage);

export default router;
