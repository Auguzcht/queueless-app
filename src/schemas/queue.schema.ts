import { z } from 'zod';

export const joinQueueSchema = z.object({
  departmentId: z.string(),
});

export const ticketStatusSchema = z.enum([
  'waiting',
  'serving',
  'completed',
  'skipped',
  'cancelled',
  'expired',
]);

export const queueTicketSchema = z.object({
  id: z.string(),
  ticket_number: z.string(),
  department_id: z.string(),
  user_id: z.string(),
  counter_id: z.string().nullable(),
  status: ticketStatusSchema,
  position: z.number(),
  joined_at: z.string(),
  called_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  skipped_at: z.string().nullable(),
  expired_at: z.string().nullable(),
  notes: z.string().nullable(),
  date: z.string(),
  created_at: z.string(),
});

export const liveQueueResponseSchema = z.array(queueTicketSchema);

export const cancelTicketSchema = z.object({
  ticketId: z.string(),
});

export type JoinQueueInput = z.infer<typeof joinQueueSchema>;
export type QueueTicket = z.infer<typeof queueTicketSchema>;
export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type CancelTicketInput = z.infer<typeof cancelTicketSchema>;
