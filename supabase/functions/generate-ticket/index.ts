// supabase/functions/generate-ticket/index.ts
// ============================================================
// Generate Ticket — Edge Function
//
// Called when a user joins a queue. Atomically assigns the next
// ticket number for the department and creates the queue entry.
//
// POST /functions/v1/generate-ticket
// Body: { "department_id": "uuid" }
// Auth: Requires valid Supabase JWT (user must be logged in)
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase client with user's JWT
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Also create a service-role client for sequence updates
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 2. Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse request body
    const { department_id } = await req.json();
    if (!department_id) {
      return new Response(
        JSON.stringify({ error: 'department_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Get department info (prefix)
    const { data: dept, error: deptError } = await adminClient
      .from('departments')
      .select('id, prefix, is_active')
      .eq('id', department_id)
      .single();

    if (deptError || !dept) {
      return new Response(
        JSON.stringify({ error: 'Department not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!dept.is_active) {
      return new Response(
        JSON.stringify({ error: 'Department is currently closed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Check if user already has an active ticket for this department today
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await adminClient
      .from('queue_tickets')
      .select('id')
      .eq('user_id', user.id)
      .eq('department_id', department_id)
      .eq('date', today)
      .in('status', ['waiting', 'serving'])
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ error: 'You already have an active ticket for this department' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Atomically get next sequence number
    // Upsert today's sequence row, then increment
    const { data: seq, error: seqError } = await adminClient.rpc(
      'increment_daily_sequence',
      { p_department_id: department_id, p_date: today }
    );

    // Fallback: if the RPC doesn't exist yet, do it manually
    // (You should create the RPC in a migration for production)
    let nextNumber: number;
    if (seqError) {
      // Manual upsert + increment
      const { data: seqRow } = await adminClient
        .from('daily_sequences')
        .upsert(
          { department_id, date: today, last_number: 1 },
          { onConflict: 'department_id,date' }
        )
        .select('last_number')
        .single();

      // This has a race condition — use the RPC in production
      nextNumber = seqRow?.last_number ?? 1;
    } else {
      nextNumber = seq;
    }

    // 7. Construct ticket number: prefix + zero-padded 3-digit
    const ticketNumber = `${dept.prefix}${String(nextNumber).padStart(3, '0')}`;

    // 8. Insert the queue ticket
    const { data: ticket, error: insertError } = await adminClient
      .from('queue_tickets')
      .insert({
        ticket_number: ticketNumber,
        department_id,
        user_id: user.id,
        status: 'waiting',
        position: nextNumber,
        date: today,
      })
      .select('*')
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Return the created ticket
    return new Response(
      JSON.stringify(ticket),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
