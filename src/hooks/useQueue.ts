import { useEffect, useCallback } from 'react';
import { useQueueStore } from '@/stores/useQueueStore';

export function useQueue(departmentId?: string) {
  const store = useQueueStore();

  useEffect(() => {
    if (departmentId) {
      store.fetchLiveBoard(departmentId);
      const unsubscribe = store.subscribeToDepartment(departmentId);
      return unsubscribe;
    }
  }, [departmentId]);

  const subscribe = useCallback((deptId: string) => {
    store.fetchLiveBoard(deptId);
    return store.subscribeToDepartment(deptId);
  }, []);

  return {
    ...store,
    subscribe,
    isConnected: Object.keys(store.liveBoard).length > 0,
  };
}
