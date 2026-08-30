import { z } from 'zod';

export const friendshipActionSchema = z.object({
  action: z.enum(['accept', 'reject', 'cancel', 'block', 'unblock']),
});
