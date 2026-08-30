import { z } from 'zod';

export const createConversationSchema = z.object({
  type: z.enum(['direct', 'group']).default('direct'),
  recipient_id: z.string().optional(), // For direct
  participant_ids: z.array(z.string()).optional(), // For group
  name: z.string().max(100).optional(),
  avatar_url: z.string().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().max(5000).optional().default(''),
  media_url: z.string().optional().default(''),
  media_type: z.enum(['text', 'image', 'video', 'file', 'voice']).default('text'),
  reply_to_id: z.string().optional().nullable(),
});
