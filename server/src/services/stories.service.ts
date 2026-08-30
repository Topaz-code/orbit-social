import { prisma } from '../config/database.js';
import { parseJson } from '../utils/helpers.js';
import { mqttService } from './mqtt.service.js';

export const storiesService = {
  async getStories(userId: string) {
    const now = new Date();

    // 1. Get friend IDs + own ID
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requester_id: userId }, { addressee_id: userId }],
      },
    });

    const friendIds = friendships.map((f) =>
      f.requester_id === userId ? f.addressee_id : f.requester_id
    );
    const visibleUserIds = [userId, ...friendIds];

    // 2. Fetch all active stories from visible users
    const stories = await prisma.story.findMany({
      where: {
        user_id: { in: visibleUserIds },
        expires_at: { gt: now },
      },
      orderBy: { created_at: 'desc' },
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

    // Group stories by user for the story tray
    const userStoriesMap = new Map<string, any>();

    for (const story of stories) {
      const viewers = parseJson<string[]>(story.viewers, []);
      const textOverlay = parseJson(story.text_overlay, null);
      const isViewed = viewers.includes(userId);

      const formattedStory = {
        ...story,
        viewers,
        text_overlay: textOverlay,
        is_viewed: isViewed,
        views_count: viewers.length,
      };

      if (!userStoriesMap.has(story.user_id)) {
        userStoriesMap.set(story.user_id, {
          user: story.user,
          is_self: story.user_id === userId,
          all_viewed: isViewed,
          latest_created_at: story.created_at,
          stories: [formattedStory],
        });
      } else {
        const entry = userStoriesMap.get(story.user_id);
        entry.stories.push(formattedStory);
        if (!isViewed) {
          entry.all_viewed = false;
        }
      }
    }

    // Sort: own story first, then users with unviewed stories, then viewed stories
    const result = Array.from(userStoriesMap.values()).sort((a, b) => {
      if (a.is_self) return -1;
      if (b.is_self) return 1;
      if (!a.all_viewed && b.all_viewed) return -1;
      if (a.all_viewed && !b.all_viewed) return 1;
      return new Date(b.latest_created_at).getTime() - new Date(a.latest_created_at).getTime();
    });

    return result;
  },

  async getStoryById(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
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

    if (!story) throw new Error('Story not found or expired');

    const viewers = parseJson<string[]>(story.viewers, []);
    const isOwner = story.user_id === userId;

    let viewerUsers: any[] = [];
    if (isOwner && viewers.length > 0) {
      viewerUsers = await prisma.user.findMany({
        where: { id: { in: viewers } },
        select: {
          id: true,
          username: true,
          display_name: true,
          avatar_url: true,
        },
      });
    }

    return {
      ...story,
      viewers,
      viewer_users: viewerUsers,
      text_overlay: parseJson(story.text_overlay, null),
      is_viewed: viewers.includes(userId),
      views_count: viewers.length,
    };
  },

  async createStory(
    userId: string,
    data: {
      media_url: string;
      media_type?: string;
      caption?: string;
      text_overlay?: any;
    }
  ) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // exactly 24 hours

    const story = await prisma.story.create({
      data: {
        user_id: userId,
        media_url: data.media_url,
        media_type: data.media_type || 'image',
        caption: data.caption || '',
        text_overlay: data.text_overlay ? JSON.stringify(data.text_overlay) : '{}',
        viewers: JSON.stringify([]),
        expires_at: expiresAt,
      },
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

    const formatted = {
      ...story,
      viewers: [],
      text_overlay: parseJson(story.text_overlay, null),
      is_viewed: true,
      views_count: 0,
    };

    mqttService.broadcastNewStory(formatted);

    return formatted;
  },

  async markAsViewed(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new Error('Story not found');

    const viewers = parseJson<string[]>(story.viewers, []);
    if (!viewers.includes(userId)) {
      viewers.push(userId);
      await prisma.story.update({
        where: { id: storyId },
        data: { viewers: JSON.stringify(viewers) },
      });
    }

    return { success: true, views_count: viewers.length };
  },

  async deleteStory(storyId: string, userId: string) {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new Error('Story not found');
    if (story.user_id !== userId) throw new Error('Unauthorized to delete this story');

    await prisma.story.delete({ where: { id: storyId } });
    return { success: true, message: 'Story deleted' };
  },
};
