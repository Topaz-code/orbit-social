import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional().default(''),
  avatar_url: z.string().optional().default(''),
  cover_url: z.string().optional().default(''),
  privacy: z.enum(['public', 'private']).default('public'),
  initial_member_ids: z.array(z.string()).max(9, 'Max 10 total members per group').optional().default([]),
});

export const updateGroupSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  avatar_url: z.string().optional(),
  cover_url: z.string().optional(),
  privacy: z.enum(['public', 'private']).optional(),
});

export const addMemberSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  role: z.enum(['admin', 'moderator', 'member']).default('member'),
});
