import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100),
  middleName: z
    .string()
    .max(100)
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100),
  email: z
    .string()
    .email('Invalid email address')
    .refine(
      (email) => email.endsWith('@mcm.edu.ph'),
      'Must use your MMCM email (@mcm.edu.ph)'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
  studentId: z.string().optional(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
