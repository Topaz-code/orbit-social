import { prisma } from '../config/database.js';
import { sanitizeUser, parseJson } from '../utils/helpers.js';

export const searchService = {
  async search(query: string, type?: string, userId?: string) {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { people: [], posts: [], groups: [] };
    }

    const searchType = type || 'all';
    let people: any[] = [];
    let posts: any[] = [];
    let groups: any[] = [];

    // 1. Search People
    if (searchType === 'all' || searchType === 'people') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q } },
            { display_name: { contains: q } },
            { bio: { contains: q } },
          ],
        },
        take: 15,
      });
      people = users.map((u) => sanitizeUser(u));
    }

    // 2. Search Posts
    if (searchType === 'all' || searchType === 'posts') {
      const foundPosts = await prisma.post.findMany({
        where: {
          content_text: { contains: q },
          visibility: 'public',
          group_id: null,
        },
        orderBy: { created_at: 'desc' },
        take: 20,
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
          likes: userId
            ? {
                where: { user_id: userId },
                select: { id: true },
              }
            : false,
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      });

      posts = foundPosts.map((p) => ({
        ...p,
        media_gallery: parseJson(p.media_gallery, []),
        link_preview: parseJson(p.link_preview, null),
        is_liked: userId ? (p.likes?.length || 0) > 0 : false,
        likes_count: p._count.likes,
        comments_count: p._count.comments,
      }));
    }

    // 3. Search Groups
    if (searchType === 'all' || searchType === 'groups') {
      const foundGroups = await prisma.group.findMany({
        where: {
          privacy: 'public',
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
          ],
        },
        take: 15,
        include: {
          _count: {
            select: {
              members: true,
              posts: true,
            },
          },
        },
      });

      groups = foundGroups.map((g) => ({
        ...g,
        member_count: g._count.members,
        post_count: g._count.posts,
      }));
    }

    return { people, posts, groups };
  },

  async getTrendingTopics() {
    // Get posts from last 48 hours to find trending hashtags and keywords
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentPosts = await prisma.post.findMany({
      where: {
        created_at: { gte: since },
        visibility: 'public',
      },
      select: {
        content_text: true,
      },
    });

    const frequencyMap = new Map<string, number>();

    const stopWords = new Set([
      'the', 'and', 'a', 'to', 'in', 'is', 'you', 'that', 'it', 'he', 'was', 'for',
      'on', 'are', 'as', 'with', 'his', 'they', 'i', 'at', 'be', 'this', 'have',
      'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were',
      'we', 'when', 'your', 'can', 'said', 'there', 'use', 'an', 'each', 'which',
      'she', 'do', 'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many',
      'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'him',
      'into', 'time', 'has', 'look', 'two', 'more', 'write', 'go', 'see', 'number',
      'no', 'way', 'could', 'people', 'my', 'than', 'first', 'water', 'been', 'call',
      'who', 'oil', 'its', 'now', 'find', 'just', 'over', 'think', 'also', 'back',
    ]);

    for (const post of recentPosts) {
      // Find hashtags
      const hashtags = post.content_text.match(/#[a-zA-Z0-9_]+/g) || [];
      for (const tag of hashtags) {
        const cleaned = tag.toLowerCase();
        frequencyMap.set(cleaned, (frequencyMap.get(cleaned) || 0) + 3);
      }

      // Find keywords
      const words = post.content_text
        .toLowerCase()
        .replace(/[^a-z0-9\s#]/g, ' ')
        .split(/\s+/);

      for (const word of words) {
        if (word.length >= 4 && !stopWords.has(word) && !word.startsWith('http')) {
          frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
        }
      }
    }

    const defaultTrending = [
      { topic: '#PrivacyFirst', count: 42 },
      { topic: '#NoAlgorithm', count: 35 },
      { topic: '#OrbitSocial', count: 28 },
      { topic: '#Photography', count: 19 },
      { topic: '#TechTrends', count: 14 },
    ];

    if (frequencyMap.size === 0) {
      return defaultTrending;
    }

    const sorted = Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([topic, count]) => ({
        topic: topic.startsWith('#') ? topic : `#${topic}`,
        count,
      }));

    return sorted.length > 0 ? sorted : defaultTrending;
  },
};
