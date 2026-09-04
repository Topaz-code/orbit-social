import { Router } from 'express';
import { commentsController } from '../controllers/comments.controller.js';
import { authenticateToken, checkBanned } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { updateCommentSchema } from '../validators/comments.validator.js';

const router = Router();

router.put('/:id', authenticateToken, checkBanned, validateBody(updateCommentSchema), commentsController.updateComment);
router.delete('/:id', authenticateToken, checkBanned, commentsController.deleteComment);

export default router;
