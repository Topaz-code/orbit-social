import { Router } from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authenticateToken, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { updateProfileSchema } from '../validators/auth.validator.js';

const router = Router();

router.get('/export/me', authenticateToken, usersController.exportData);
router.delete('/delete/me', authenticateToken, usersController.deleteAccount);
router.get('/discover', optionalAuthenticate, usersController.getDiscoverUsers);
router.get('/suggested', authenticateToken, usersController.getSuggestedFriends);
router.get('/:id', optionalAuthenticate, usersController.getUserProfile);
router.put('/:id', authenticateToken, validateBody(updateProfileSchema), usersController.updateUserProfile);
router.get('/:id/posts', optionalAuthenticate, usersController.getUserPosts);
router.get('/:id/friends', optionalAuthenticate, usersController.getUserFriends);
router.get('/:id/media', optionalAuthenticate, usersController.getUserMedia);

export default router;
