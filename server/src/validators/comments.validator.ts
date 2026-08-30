import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000),
  parent_comment_id: z.string().optional().nullable(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});
