import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No auth" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { department_id } = await req.json();
    if (!department_id) {
      return new Response(
        JSON.stringify({ error: "Missing department_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use anon key for all queries (RLS allows authenticated users to insert)
    const db = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Get department prefix
    const { data: dept, error: deptErr } = await db
      .from("departments")
      .select("prefix")
      .eq("id", department_id)
      .single();

    if (deptErr || !dept) {
      return new Response(
        JSON.stringify({ error: "Department not found", detail: deptErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check existing active ticket
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await db
      .from("queue_tickets")
      .select("id")
      .eq("user_id", user.id)
      .eq("department_id", department_id)
      .eq("date", today)
      .in("status", ["waiting", "serving"])
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ error: "You already have an active ticket" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get next sequence number
    let nextNumber = 1;
    if (serviceKey) {
      const adminDb = createClient(supabaseUrl, serviceKey);
      const { data: seq } = await adminDb.rpc("increment_daily_sequence", {
        p_department_id: department_id,
        p_date: today,
      }).maybeSingle();

      if (seq) nextNumber = seq;
    }

    // Fallback: manual upsert
    if (!serviceKey || !nextNumber) {
      const { data: seqRow } = await db
        .from("daily_sequences")
        .upsert(
          { department_id, date: today, last_number: 1 },
          { onConflict: "department_id,date" }
        )
        .select("last_number")
        .single();

      if (seqRow?.last_number) nextNumber = seqRow.last_number;
    }

    // Create ticket
    const ticketNumber = `${dept.prefix}${String(nextNumber).padStart(3, "0")}`;

    const { data: ticket, error: insertErr } = await db
      .from("queue_tickets")
      .insert({
        ticket_number: ticketNumber,
        department_id,
        user_id: user.id,
        status: "waiting",
        position: nextNumber,
        date: today,
      })
      .select("*")
      .single();

    if (insertErr) {
      return new Response(
        JSON.stringify({ error: insertErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(ticket),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
