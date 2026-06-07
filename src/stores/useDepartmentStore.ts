import { create } from 'zustand';
import type { Department, Counter } from '@/schemas/department.schema';
import { departmentService } from '@/services/department.service';

interface DepartmentState {
  departments: Department[];
  counters: Record<string, Counter[]>;
  isLoading: boolean;

  fetchDepartments: () => Promise<void>;
  fetchCounters: (departmentId: string) => Promise<void>;
  getDepartmentStatus: (departmentId: string) => Promise<{
    waitingCount: number;
    nowServing: string | null;
  }>;
  reset: () => void;
}

export const useDepartmentStore = create<DepartmentState>((set, get) => ({
  departments: [],
  counters: {},
  isLoading: false,

  fetchDepartments: async () => {
    set({ isLoading: true });
    try {
      const departments = await departmentService.getAllDepartments();
      set({ departments, isLoading: false });
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
    set({ departments: [], counters: {}, isLoading: false });
  },
}));
