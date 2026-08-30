import { Router } from 'express';
import { storiesController } from '../controllers/stories.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { createStorySchema } from '../validators/stories.validator.js';

const router = Router();

router.get('/', authenticateToken, storiesController.getStories);
router.post('/', authenticateToken, validateBody(createStorySchema), storiesController.createStory);
router.get('/:id', authenticateToken, storiesController.getStoryById);
router.post('/:id/view', authenticateToken, storiesController.markAsViewed);
router.delete('/:id', authenticateToken, storiesController.deleteStory);

export default router;
