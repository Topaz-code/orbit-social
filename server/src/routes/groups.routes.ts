import { Router } from 'express';
import { groupsController } from '../controllers/groups.controller.js';
import { authenticateToken, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
} from '../validators/groups.validator.js';
import { createPostSchema } from '../validators/posts.validator.js';

const router = Router();

router.get('/', authenticateToken, groupsController.getMyGroups);
router.get('/discover', authenticateToken, groupsController.getDiscoverGroups);
router.post('/', authenticateToken, validateBody(createGroupSchema), groupsController.createGroup);
router.get('/:id', optionalAuthenticate, groupsController.getGroupById);
router.put('/:id', authenticateToken, validateBody(updateGroupSchema), groupsController.updateGroup);
router.delete('/:id', authenticateToken, groupsController.deleteGroup);
router.post('/:id/join', authenticateToken, groupsController.joinGroup);
router.post('/:id/leave', authenticateToken, groupsController.leaveGroup);
router.post('/:id/members', authenticateToken, validateBody(addMemberSchema), groupsController.addMember);
router.delete('/:id/members/:userId', authenticateToken, groupsController.removeMember);
router.get('/:id/posts', authenticateToken, groupsController.getGroupPosts);
router.post('/:id/posts', authenticateToken, validateBody(createPostSchema), groupsController.createGroupPost);

export default router;
