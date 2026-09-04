import { Router } from 'express';
import { conversationsController } from '../controllers/conversations.controller.js';
import { authenticateToken, checkBanned } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import {
  createConversationSchema,
  sendMessageSchema,
} from '../validators/conversations.validator.js';

const router = Router();

router.get('/', authenticateToken, checkBanned, conversationsController.getConversations);
router.post('/', authenticateToken, checkBanned, validateBody(createConversationSchema), conversationsController.createConversation);
router.get('/:id', authenticateToken, checkBanned, conversationsController.getConversationById);
router.put('/:id/read', authenticateToken, checkBanned, conversationsController.markAsRead);
router.get('/:id/messages', authenticateToken, checkBanned, conversationsController.getMessages);
router.post('/:id/messages', authenticateToken, checkBanned, validateBody(sendMessageSchema), conversationsController.sendMessage);

export default router;
