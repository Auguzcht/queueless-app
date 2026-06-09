import { supabase } from '@/lib/supabase';
import { queueTicketSchema, type QueueTicket } from '@/schemas/queue.schema';
import { QueueError } from '@/types/errors';

export const queueService = {
  async joinQueue(departmentId: string): Promise<QueueTicket> {
    const { data, error } = await supabase.functions.invoke('generate-ticket', {
      body: { department_id: departmentId },
    });

    if (error) {
      // Try to extract the response body
      let detail = error.message;
      try {
        const ctx = (error as any)?.context;
        if (ctx?.body) {
          const text = await ctx.body.text();
          const json = JSON.parse(text);
          detail = json.error || text;
        }
      } catch {}
      console.error('Edge function error detail:', detail);
      throw new QueueError(detail, 'JOIN_FAILED');
    }
    const parsed = queueTicketSchema.parse(data);
    return parsed;
  },

  async cancelTicket(ticketId: string) {
    const { error } = await supabase
      .from('queue_tickets')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', ticketId)
      .eq('status', 'waiting');

    if (error) throw new QueueError(error.message, 'CANCEL_FAILED');
  },

  async getActiveTickets(userId: string): Promise<QueueTicket[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await (supabase
      .from('queue_tickets')
      .select() as any)
      .eq('user_id', userId)
      .eq('date', today)
      .in('status', ['waiting', 'serving', 'completed'])
      .order('joined_at', { ascending: false });

    if (error) throw new QueueError(error.message);
    return (data ?? []).map((d: any) => queueTicketSchema.parse(d));
  },

  async getLiveBoard(departmentId: string): Promise<QueueTicket[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await (supabase
      .from('queue_tickets')
      .select() as any)
      .eq('department_id', departmentId)
      .eq('date', today)
      .in('status', ['waiting', 'serving'])
      .order('position', { ascending: true });

    if (error) throw new QueueError(error.message);
    return (data ?? []).map((d: any) => queueTicketSchema.parse(d));
  },

  async getQueueHistory(userId: string, page: number = 1, pageSize: number = 20) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await (supabase
      .from('queue_tickets')
      .select() as any)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new QueueError(error.message);
    return {
      data: (data ?? []).map((d: any) => queueTicketSchema.parse(d)),
      count: count ?? 0,
    };
  },

  async getQueueDetails(ticketId: string): Promise<QueueTicket> {
    const { data, error } = await supabase
      .from('queue_tickets')
      .select('*, departments(*), counters(*)')
      .eq('id', ticketId)
      .single();

    if (error) throw new QueueError(error.message, 'NOT_FOUND');
    return queueTicketSchema.parse(data);
  },

  subscribeToDepartment(departmentId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`live-queue-${departmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_tickets',
          filter: `department_id=eq.${departmentId}`,
        },
        callback,
      )
      .subscribe();
  },

  subscribeToMyTickets(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`my-tickets-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_tickets',
          filter: `user_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();
  },
};
