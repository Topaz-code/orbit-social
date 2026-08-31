import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// Register or update device token
router.post('/token', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { token, platform } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Device token is required' });
    }

    const userId = req.user!.userId;
    const device = await prisma.deviceToken.upsert({
      where: { token },
      update: {
        user_id: userId,
        platform: platform || 'android',
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        token,
        platform: platform || 'android',
      },
    });

    res.json({ success: true, data: device });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove device token on logout
router.delete('/token', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { token } = req.body;
    const userId = req.user!.userId;

    if (token) {
      await prisma.deviceToken.deleteMany({
        where: { token, user_id: userId },
      });
    } else {
      // If no specific token given, remove all tokens for this user on this device
      await prisma.deviceToken.deleteMany({
        where: { user_id: userId },
      });
    }

    res.json({ success: true, message: 'Device token unregistered' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
