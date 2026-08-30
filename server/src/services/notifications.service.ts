import { prisma } from '../config/database.js';

export const notificationsService = {
  async getNotifications(userId: string, limit = 30) {
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });

    return {
      notifications,
      unread_count: unreadCount,
    };
  },

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) throw new Error('Notification not found');
    if (notification.user_id !== userId) throw new Error('Unauthorized');

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true },
    });

    return updated;
  },

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });

    return { success: true, message: 'All notifications marked as read' };
  },

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) throw new Error('Notification not found');
    if (notification.user_id !== userId) throw new Error('Unauthorized');

    await prisma.notification.delete({ where: { id: notificationId } });
    return { success: true, message: 'Notification deleted' };
  },
};
