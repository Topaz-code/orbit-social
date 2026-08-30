import { z } from 'zod';

export const createPostSchema = z.object({
  content_text: z.string().min(1, 'Post content cannot be empty').max(3000),
  media_url: z.string().optional().default(''),
  media_type: z.string().optional().default(''),
  media_gallery: z.array(z.string()).optional().default([]),
  link_url: z.string().optional().default(''),
  visibility: z.enum(['public', 'friends', 'private']).optional().default('public'),
  group_id: z.string().optional().nullable(),
});

export const updatePostSchema = z.object({
  content_text: z.string().min(1).max(3000).optional(),
  visibility: z.enum(['public', 'friends', 'private']).optional(),
});
