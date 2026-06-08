import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100)
    .optional(),
  middleName: z
    .string()
    .max(100)
    .optional()
    .or(z.literal('')),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100)
    .optional(),
  suffix: z
    .string()
    .max(10)
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+?[\d\s-()]{7,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
});

export const profileResponseSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string(),
  middle_name: z.string().nullable(),
  last_name: z.string(),
  suffix: z.string().nullable(),
  phone: z.string().nullable(),
  avatar_url: z.string().nullable(),
  role: z.enum(['student', 'parent', 'staff', 'admin']),
  is_verified: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
