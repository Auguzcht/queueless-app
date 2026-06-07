// supabase/functions/estimate-wait/index.ts
// ============================================================
// Estimate Wait Time — Edge Function
//
// Calculates estimated wait time for a department based on
// historical data and current queue length.
//
// GET /functions/v1/estimate-wait?department_id=uuid
// Auth: Optional (public endpoint)
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_SERVICE_SECONDS = 300; // 5 minutes fallback
const BUFFER_MULTIPLIER = 1.3;       // +30% buffer for uncertainty

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Parse query params
    const url = new URL(req.url);
    const departmentId = url.searchParams.get('department_id');

    if (!departmentId) {
      return new Response(
        JSON.stringify({ error: 'department_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    // 1. Count people currently waiting
    const { count: waitingCount } = await adminClient
      .from('queue_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', departmentId)
      .eq('date', today)
      .eq('status', 'waiting');

    const peopleAhead = waitingCount ?? 0;

    // 2. Get average service time from historical data (last 7 days, same hour)
    const { data: stats } = await adminClient
      .from('wait_time_stats')
      .select('avg_service_seconds')
      .eq('department_id', departmentId)
      .eq('hour', currentHour)
      .gte('date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(7);

    let avgServiceSeconds = DEFAULT_SERVICE_SECONDS;
    if (stats && stats.length > 0) {
      const validStats = stats.filter(s => s.avg_service_seconds > 0);
      if (validStats.length > 0) {
        avgServiceSeconds = validStats.reduce(
          (sum, s) => sum + Number(s.avg_service_seconds), 0
        ) / validStats.length;
      }
    }

    // 3. Count active counters
    const { count: activeCounters } = await adminClient
      .from('counters')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', departmentId)
      .eq('is_active', true);

    const counters = Math.max(activeCounters ?? 1, 1);

    // 4. Calculate estimate
    const rawMinutes = (avgServiceSeconds * peopleAhead) / counters / 60;
    const minMinutes = Math.max(Math.floor(rawMinutes), 1);
    const maxMinutes = Math.ceil(rawMinutes * BUFFER_MULTIPLIER);

    return new Response(
      JSON.stringify({
        department_id: departmentId,
        people_ahead: peopleAhead,
        active_counters: counters,
        min_minutes: minMinutes,
        max_minutes: maxMinutes,
        display: peopleAhead === 0
          ? 'No wait'
          : `${minMinutes}-${maxMinutes} mins`,
        confidence: stats && stats.length >= 5 ? 'high' : stats && stats.length >= 2 ? 'medium' : 'low',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
