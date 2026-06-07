// supabase/functions/advance-queue/index.ts
// ============================================================
// Advance Queue — Edge Function (Staff Only)
//
// Called by staff to serve the next person in line. Completes
// the current ticket and marks the next waiting ticket as serving.
//
// POST /functions/v1/advance-queue
// Body: { "department_id": "uuid", "counter_id": "uuid" }
// Auth: Requires staff or admin role
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Verify user is staff or admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['staff', 'admin'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse body
    const { department_id, counter_id } = await req.json();
    if (!department_id || !counter_id) {
      return new Response(
        JSON.stringify({ error: 'department_id and counter_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // 3. Complete the current serving ticket for this counter (if any)
    const { data: currentServing } = await adminClient
      .from('queue_tickets')
      .select('id')
      .eq('department_id', department_id)
      .eq('counter_id', counter_id)
      .eq('date', today)
      .eq('status', 'serving')
      .limit(1)
      .single();

    if (currentServing) {
      await adminClient
        .from('queue_tickets')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', currentServing.id);
    }

    // 4. Get the next waiting ticket (lowest position)
    const { data: nextTicket, error: nextError } = await adminClient
      .from('queue_tickets')
      .select('*')
      .eq('department_id', department_id)
      .eq('date', today)
      .eq('status', 'waiting')
      .order('position', { ascending: true })
      .limit(1)
      .single();

    if (nextError || !nextTicket) {
      return new Response(
        JSON.stringify({ message: 'No one in queue', ticket: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Mark as serving and assign counter
    const { data: updatedTicket, error: updateError } = await adminClient
      .from('queue_tickets')
      .update({
        status: 'serving',
        counter_id,
        called_at: new Date().toISOString(),
      })
      .eq('id', nextTicket.id)
      .select('*')
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Send push notification to the called user
    // (Invoke the send-notification function internally)
    await adminClient.functions.invoke('send-notification', {
      body: {
        user_id: nextTicket.user_id,
        type: 'your_turn',
        title: "Your turn!",
        body: `Please proceed to Counter ${counter_id}. Your number is ${nextTicket.ticket_number}.`,
        data: { ticket_id: nextTicket.id, department_id },
      },
    });

    // 7. Send "almost your turn" to the person who is now 2nd in line
    const { data: almostNext } = await adminClient
      .from('queue_tickets')
      .select('user_id, ticket_number, id')
      .eq('department_id', department_id)
      .eq('date', today)
      .eq('status', 'waiting')
      .order('position', { ascending: true })
      .limit(1)
      .single();

    if (almostNext) {
      await adminClient.functions.invoke('send-notification', {
        body: {
          user_id: almostNext.user_id,
          type: 'almost_your_turn',
          title: "Almost your turn!",
          body: `Get ready. ${almostNext.ticket_number} will be called soon.`,
          data: { ticket_id: almostNext.id, department_id },
        },
      });
    }

    return new Response(
      JSON.stringify({ ticket: updatedTicket }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
