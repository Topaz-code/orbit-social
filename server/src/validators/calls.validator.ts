import { z } from 'zod';

export const initiateCallSchema = z.object({
  receiver_id: z.string().min(1, 'Receiver ID is required'),
  conversation_id: z.string().optional().default(''),
  type: z.enum(['voice', 'video']).default('voice'),
});

export const updateCallSchema = z.object({
  status: z.enum(['ongoing', 'completed', 'missed', 'rejected']),
  duration: z.number().int().nonnegative().optional(),
});
