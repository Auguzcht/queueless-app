import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueueTicket } from '@/schemas/queue.schema';
import { queueService } from '@/services/queue.service';

interface QueueState {
  activeTickets: QueueTicket[];
  liveBoard: Record<string, QueueTicket[]>;
  isLoading: boolean;
  error: string | null;

  fetchActiveTickets: (userId: string) => Promise<void>;
  joinQueue: (departmentId: string) => Promise<QueueTicket>;
  cancelTicket: (ticketId: string) => Promise<void>;
  fetchLiveBoard: (departmentId: string) => Promise<void>;
  subscribeToDepartment: (departmentId: string) => () => void;
  subscribeToMyTickets: (userId: string) => () => void;
  handleRealtimeUpdate: (payload: any) => void;
  reset: () => void;
}

export const useQueueStore = create<QueueState>()(
  persist(
    (set, get) => ({
      activeTickets: [],
      liveBoard: {},
      isLoading: false,
      error: null,

      fetchActiveTickets: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const tickets = await queueService.getActiveTickets(userId);
          set({ activeTickets: tickets, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      joinQueue: async (departmentId) => {
        set({ isLoading: true, error: null });
        try {
          const ticket = await queueService.joinQueue(departmentId);
          set((state) => ({
            activeTickets: [ticket, ...state.activeTickets],
            isLoading: false,
          }));
          return ticket;
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      cancelTicket: async (ticketId) => {
        set({ error: null });
        try {
          await queueService.cancelTicket(ticketId);
          set((state) => ({
            activeTickets: state.activeTickets.filter((t) => t.id !== ticketId),
          }));
        } catch (err: any) {
          console.error('Cancel failed:', err.message);
          set({ error: err.message });
        }
      },

      fetchLiveBoard: async (departmentId) => {
        try {
          const tickets = await queueService.getLiveBoard(departmentId);
          set((state) => ({
            liveBoard: { ...state.liveBoard, [departmentId]: tickets },
          }));
        } catch (err: any) {
          console.error('Failed to fetch live board:', err);
        }
      },

      subscribeToDepartment: (departmentId) => {
        const channel = queueService.subscribeToDepartment(departmentId, (payload) => {
          get().handleRealtimeUpdate(payload);
        });
        return () => { channel.unsubscribe(); };
      },

      subscribeToMyTickets: (userId) => {
        const channel = queueService.subscribeToMyTickets(userId, (payload) => {
          get().handleRealtimeUpdate(payload);
        });
        return () => { channel.unsubscribe(); };
      },

      handleRealtimeUpdate: (payload) => {
        const { activeTickets } = get();
        const updated = activeTickets.map((t) =>
          t.id === payload.new.id ? { ...t, ...payload.new } : t,
        );
        if (!updated.find((t) => t.id === payload.new.id)) {
          updated.push(payload.new);
        }
        set({ activeTickets: updated });
      },

      reset: () => {
        set({ activeTickets: [], liveBoard: {}, isLoading: false, error: null });
      },
    }),
    {
      name: 'queueless-queue',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeTickets: state.activeTickets,
      }),
    },
  ),
);
