import { create } from 'zustand';
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
  handleRealtimeUpdate: (payload: any) => void;
  reset: () => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
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
      set({ error: err.message });
      throw err;
    }
  },

  fetchLiveBoard: async (departmentId) => {
    try {
      const board = await queueService.getLiveBoard(departmentId);
      set((state) => ({
        liveBoard: { ...state.liveBoard, [departmentId]: board },
      }));
    } catch (err: any) {
      console.error('Failed to fetch live board:', err.message);
    }
  },

  subscribeToDepartment: (departmentId) => {
    const subscription = queueService.subscribeToDepartment(
      departmentId,
      (payload) => {
        get().handleRealtimeUpdate(payload);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  },

  handleRealtimeUpdate: (payload) => {
    const { liveBoard, activeTickets } = get();
    const { eventType, new: newRecord, old: oldRecord } = payload;

    // Update live board
    const deptId = newRecord?.department_id ?? oldRecord?.department_id;
    if (deptId && liveBoard[deptId]) {
      const current = [...liveBoard[deptId]];

      if (eventType === 'INSERT') {
        current.push(newRecord);
      } else if (eventType === 'UPDATE') {
        const idx = current.findIndex((t) => t.id === newRecord.id);
        if (idx >= 0) current[idx] = newRecord;
        else current.push(newRecord);
      } else if (eventType === 'DELETE') {
        const filtered = current.filter((t) => t.id !== oldRecord.id);
        set((state) => ({
          liveBoard: { ...state.liveBoard, [deptId]: filtered },
        }));
        return;
      }

      const sorted = current.sort((a, b) => a.position - b.position);
      set((state) => ({
        liveBoard: { ...state.liveBoard, [deptId]: sorted },
      }));
    }

    // Update active tickets if user's ticket changed
    if (newRecord) {
      const idx = activeTickets.findIndex((t) => t.id === newRecord.id);
      if (idx >= 0) {
        const updated = [...activeTickets];
        updated[idx] = newRecord;
        set({ activeTickets: updated });
      } else if (eventType === 'INSERT' && !activeTickets.find((t) => t.id === newRecord.id)) {
        set({ activeTickets: [...activeTickets, newRecord] });
      }
    }
  },

  reset: () => {
    set({ activeTickets: [], liveBoard: {}, isLoading: false, error: null });
  },
}));
