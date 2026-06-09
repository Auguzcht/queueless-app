import { supabase } from '@/lib/supabase';
import { notificationSchema, type NotificationItem } from '@/schemas/notification.schema';
import { AppError } from '@/types/errors';

export const notificationService = {
  async registerPushToken(token: string, platform: 'ios' | 'android') {
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          token,
          platform,
          is_active: true,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        },
        { onConflict: 'token' },
      );

    if (error) throw new AppError(error.message, 'PUSH_TOKEN_ERROR');
  },

  async getNotifications(userId: string, page: number = 1, pageSize: number = 20) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await (supabase
      .from('notifications')
      .select() as any)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new AppError(error.message, 'NOTIFICATION_FETCH_ERROR');
    return {
      data: (data ?? []).map((d: any) => notificationSchema.parse(d)),
      count: count ?? 0,
    };
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw new AppError(error.message, 'MARK_READ_ERROR');
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .is('is_read', false);

    if (error) throw new AppError(error.message, 'MARK_ALL_READ_ERROR');
  },

  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications-${userId}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, callback)
      .subscribe();
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false) as any;

    if (error) throw new AppError(error.message, 'UNREAD_COUNT_ERROR');
    return (count as number) ?? 0;
  },
};
