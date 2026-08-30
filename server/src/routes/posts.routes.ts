import { Router } from 'express';
import { postsController } from '../controllers/posts.controller.js';
import { authenticateToken, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { createPostSchema, updatePostSchema } from '../validators/posts.validator.js';
import { createCommentSchema } from '../validators/comments.validator.js';

const router = Router();

router.get('/', authenticateToken, postsController.getFeed);
router.get('/explore', optionalAuthenticate, postsController.getExploreFeed);
router.post('/', authenticateToken, validateBody(createPostSchema), postsController.createPost);
router.get('/:id', optionalAuthenticate, postsController.getPostById);
router.put('/:id', authenticateToken, validateBody(updatePostSchema), postsController.updatePost);
router.delete('/:id', authenticateToken, postsController.deletePost);
router.post('/:id/like', authenticateToken, postsController.likePost);
router.delete('/:id/like', authenticateToken, postsController.unlikePost);
router.get('/:id/comments', optionalAuthenticate, postsController.getComments);
router.post('/:id/comments', authenticateToken, validateBody(createCommentSchema), postsController.createComment);

export default router;
