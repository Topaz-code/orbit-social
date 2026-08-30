import { Router } from 'express';
import { friendsController } from '../controllers/friends.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, friendsController.getFriends);
router.get('/requests', authenticateToken, friendsController.getFriendRequests);
router.post('/request/:userId', authenticateToken, friendsController.sendFriendRequest);
router.post('/accept/:requestId', authenticateToken, friendsController.acceptFriendRequest);
router.put('/accept/:requestId', authenticateToken, friendsController.acceptFriendRequest);
router.post('/reject/:requestId', authenticateToken, friendsController.rejectFriendRequest);
router.put('/reject/:requestId', authenticateToken, friendsController.rejectFriendRequest);
router.delete('/:friendshipId', authenticateToken, friendsController.removeFriend);
router.post('/block/:userId', authenticateToken, friendsController.blockUser);

export default router;
