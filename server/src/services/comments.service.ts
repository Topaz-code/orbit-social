import { prisma } from '../config/database.js';
import { mqttService } from './mqtt.service.js';

export const commentsService = {
  async getCommentsByPostId(postId: string) {
    const comments = await prisma.comment.findMany({
      where: {
        post_id: postId,
        parent_comment_id: null, // Top-level comments
      },
      orderBy: { created_at: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_online: true,
          },
        },
        replies: {
          orderBy: { created_at: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true,
                is_online: true,
              },
            },
          },
        },
      },
    });

    return comments;
  },

  async createComment(
    userId: string,
    postId: string,
    data: { content: string; parent_comment_id?: string | null }
  ) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) throw new Error('Post not found');

    const comment = await prisma.comment.create({
      data: {
        post_id: postId,
        user_id: userId,
        parent_comment_id: data.parent_comment_id || null,
        content: data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_online: true,
          },
        },
      },
    });

    // Increment post comments count
    await prisma.post.update({
      where: { id: postId },
      data: { comments_count: { increment: 1 } },
    });

    // Send notification if commenting on someone else's post
    if (post.user_id !== userId) {
      const commenter = await prisma.user.findUnique({
        where: { id: userId },
        select: { display_name: true },
      });

      const notification = await prisma.notification.create({
        data: {
          user_id: post.user_id,
          type: 'post_comment',
          reference_id: postId,
          reference_type: 'post',
          content: `${commenter?.display_name || 'Someone'} commented on your post: "${data.content.slice(0, 40)}..."`,
        },
      });

      mqttService.sendNotification(post.user_id, notification);
    }

    return comment;
  },

  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new Error('Comment not found');
    if (comment.user_id !== userId) throw new Error('Unauthorized to edit this comment');

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    });

    return updated;
  },

  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment) throw new Error('Comment not found');
    // Allow author of comment or author of post to delete
    if (comment.user_id !== userId && comment.post.user_id !== userId) {
      throw new Error('Unauthorized to delete this comment');
    }

    // Count replies to accurately decrement post comments_count
    const replyCount = await prisma.comment.count({
      where: { parent_comment_id: commentId },
    });

    await prisma.comment.delete({ where: { id: commentId } });

    await prisma.post.update({
      where: { id: comment.post_id },
      data: { comments_count: { decrement: 1 + replyCount } },
    });

    return { success: true, message: 'Comment deleted successfully' };
  },
};
