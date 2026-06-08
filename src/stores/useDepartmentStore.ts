import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Department, Counter } from '@/schemas/department.schema';
import { departmentService } from '@/services/department.service';

interface DepartmentState {
  departments: Department[];
  counters: Record<string, Counter[]>;
  isLoading: boolean;
  lastFetched: number | null;

  fetchDepartments: () => Promise<void>;
  fetchCounters: (departmentId: string) => Promise<void>;
  getDepartmentStatus: (departmentId: string) => Promise<{
    waitingCount: number;
    nowServing: string | null;
  }>;
  reset: () => void;
}

const STALE_MS = 5 * 60 * 1000; // 5 minutes

export const useDepartmentStore = create<DepartmentState>()(
  persist(
    (set, get) => ({
      departments: [],
      counters: {},
      isLoading: false,
      lastFetched: null,

      fetchDepartments: async () => {
        const now = Date.now();
        const last = get().lastFetched;
        // Skip fetch if data is fresh enough
        if (last && now - last < STALE_MS && get().departments.length > 0) {
          return;
        }
        set({ isLoading: true });
        try {
          const departments = await departmentService.getAllDepartments();
          set({ departments, isLoading: false, lastFetched: now });
        } catch (err) {
          set({ isLoading: false });
        }
      },

      fetchCounters: async (departmentId) => {
        try {
          const counters = await departmentService.getCounters(departmentId);
          set((state) => ({
            counters: { ...state.counters, [departmentId]: counters },
          }));
        } catch (err) {
          console.error('Failed to fetch counters:', err);
        }
      },

      getDepartmentStatus: async (departmentId) => {
        return await departmentService.getDepartmentStatus(departmentId);
      },

      reset: () => {
        set({ departments: [], counters: {}, isLoading: false, lastFetched: null });
      },
    }),
    {
      name: 'queueless-departments',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        departments: state.departments,
        lastFetched: state.lastFetched,
      }),
    },
  ),
);
