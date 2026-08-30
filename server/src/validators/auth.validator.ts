import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  display_name: z.string().min(1, 'Display name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  bio: z.string().max(250).optional().default(''),
  avatar_url: z.string().optional().default(''),
  security_question: z.string().optional().default("What is your pet's name?"),
  security_answer: z.string().optional().default(''),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Username, email or phone is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(true),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const resetPasswordSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  security_answer: z.string().min(1, 'Security answer is required'),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
});

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(250).optional(),
  avatar_url: z.string().optional(),
  cover_url: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  privacy_settings: z.any().optional(),
});
