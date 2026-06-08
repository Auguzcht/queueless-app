import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_SERVICE_SECONDS = 300;
const BUFFER_MULTIPLIER = 1.3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !anonKey) {
      return new Response(
        JSON.stringify({ error: "Missing env vars" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse department_id from POST body
    const body = await req.json();
    const departmentId = body?.department_id;

    if (!departmentId) {
      return new Response(
        JSON.stringify({ error: "department_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const db = createClient(supabaseUrl, serviceKey || anonKey);

    const today = new Date().toISOString().slice(0, 10);
    const currentHour = new Date().getHours();

    // Count waiting tickets
    const { count: waitingCount } = await db
      .from("queue_tickets")
      .select("*", { count: "exact", head: true })
      .eq("department_id", departmentId)
      .eq("date", today)
      .eq("status", "waiting");

    const peopleAhead = waitingCount ?? 0;

    // Get average service time from last 7 days
    const { data: stats } = await db
      .from("wait_time_stats")
      .select("avg_service_seconds")
      .eq("department_id", departmentId)
      .eq("day_of_week", new Date().getDay())
      .order("date", { ascending: false })
      .limit(7);

    let avgServiceSeconds = DEFAULT_SERVICE_SECONDS;
    if (stats && stats.length > 0) {
      const valid = stats.filter((s: any) => s.avg_service_seconds > 0);
      if (valid.length > 0) {
        avgServiceSeconds = valid.reduce((a: number, s: any) => a + s.avg_service_seconds, 0) / valid.length;
      }
    }

    // Count active counters
    const { count: activeCounters } = await db
      .from("counters")
      .select("*", { count: "exact", head: true })
      .eq("department_id", departmentId)
      .eq("is_active", true);

    const counters = Math.max(activeCounters ?? 1, 1);

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
        display: peopleAhead === 0 ? "No wait" : `${minMinutes}-${maxMinutes} mins`,
        confidence: stats && stats.length >= 5 ? "high" : stats && stats.length >= 2 ? "medium" : "low",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
