import cron from 'node-cron';
import { prisma } from '../config/database.js';

export function startStoryCleanupCron(): void {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const deleted = await prisma.story.deleteMany({
        where: {
          expires_at: {
            lt: now,
          },
        },
      });
      if (deleted.count > 0) {
        console.log(`🧹 Story Cleanup: Removed ${deleted.count} expired stories.`);
      }
    } catch (error) {
      console.error('❌ Story Cleanup Error:', error);
    }
  });

  console.log('⏰ Story auto-cleanup cron job initialized (hourly).');
}
