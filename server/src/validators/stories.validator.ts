import { z } from 'zod';

export const createStorySchema = z.object({
  media_url: z.string().min(1, 'Media URL is required'),
  media_type: z.enum(['image', 'video']).optional().default('image'),
  caption: z.string().max(500).optional().default(''),
  text_overlay: z.any().optional(),
});
