import { supabase } from '@/lib/supabase';
import { AppError } from '@/types/errors';

export interface WaitTimeEstimate {
  department_id: string;
  people_ahead: number;
  active_counters: number;
  min_minutes: number;
  max_minutes: number;
  display: string;
  confidence: 'high' | 'medium' | 'low';
}

export const waittimeService = {
  async estimateWait(departmentId: string): Promise<WaitTimeEstimate> {
    const { data, error } = await supabase.functions.invoke('estimate-wait', {
      body: { department_id: departmentId },
    });

    if (error) throw new AppError(error.message, 'WAIT_ESTIMATE_ERROR');
    return data as WaitTimeEstimate;
  },

  async getWaitStats(departmentId: string, days: number = 7) {
    const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

    const { data, error } = await (supabase
      .from('wait_time_stats')
      .select() as any)
      .eq('department_id', departmentId)
      .gte('date', since)
      .order('date', { ascending: false })
      .order('hour', { ascending: false })
      .limit(50);

    if (error) throw new AppError(error.message, 'WAIT_STATS_ERROR');
    return data ?? [];
  },
};
