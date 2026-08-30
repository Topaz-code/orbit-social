import { z } from 'zod';

export const createStorySchema = z.object({
  media_url: z.string().min(1, 'Media URL is required for story'),
  media_type: z.enum(['image', 'video']).optional().default('image'),
  caption: z.string().max(300).optional().default(''),
  text_overlay: z
    .object({
      text: z.string(),
      color: z.string().optional(),
      bgColor: z.string().optional(),
      fontSize: z.number().optional(),
      position: z.enum(['top', 'center', 'bottom']).optional(),
    })
    .optional(),
});
