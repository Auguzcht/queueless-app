import { create } from 'zustand';
import type { NotificationItem } from '@/schemas/notification.schema';
import { notificationService } from '@/services/notification.service';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: (userId: string, page?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => () => void;
  setUnreadCount: (count: number) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (userId, page = 1) => {
    set({ isLoading: true });
    try {
      const result = await notificationService.getNotifications(userId, page);
      set({
        notifications: page === 1
          ? result.data
          : [...get().notifications, ...result.data],
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId) => {
    await notificationService.markAsRead(notificationId);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async (userId) => {
    await notificationService.markAllAsRead(userId);
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },

  subscribeToNotifications: (userId) => {
    const channel = notificationService.subscribeToNotifications(userId, (payload) => {
      const newNotif = payload.new as NotificationItem;
      set((state) => ({
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    });
    return () => { channel.unsubscribe(); };
  },

  setUnreadCount: (count) => set({ unreadCount: count }),

  reset: () => {
    set({ notifications: [], unreadCount: 0, isLoading: false });
  },
}));
