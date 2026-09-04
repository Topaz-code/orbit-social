import { Router } from 'express';
import { storiesController } from '../controllers/stories.controller.js';
import { authenticateToken, checkBanned } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { createStorySchema } from '../validators/stories.validator.js';

const router = Router();

router.get('/', authenticateToken, checkBanned, storiesController.getStories);
router.post('/', authenticateToken, checkBanned, validateBody(createStorySchema), storiesController.createStory);
router.get('/:id', authenticateToken, checkBanned, storiesController.getStoryById);
router.post('/:id/view', authenticateToken, checkBanned, storiesController.markAsViewed);
router.delete('/:id', authenticateToken, checkBanned, storiesController.deleteStory);

export default router;
