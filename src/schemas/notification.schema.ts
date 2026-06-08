import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'queue_joined',
  'almost_your_turn',
  'your_turn',
  'queue_completed',
  'queue_cancelled',
  'queue_skipped',
  'queue_expired',
  'system_announcement',
]);

export const notificationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.any()).nullable(),
  is_read: z.boolean(),
  created_at: z.string(),
});

export const notificationListSchema = z.object({
  data: z.array(notificationSchema),
  count: z.number().nullable(),
});

export type NotificationItem = z.infer<typeof notificationSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
