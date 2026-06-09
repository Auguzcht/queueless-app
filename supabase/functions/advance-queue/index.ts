import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    console.log("ENV:", { u: !!supabaseUrl, a: !!anonKey, s: !!serviceKey, sl: serviceKey.length });

    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: "Missing env" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", detail: authError?.message }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check staff/admin role via service-role client
    // Auth client with user JWT for profile query
  const authDb = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
    const { data: profile } = await authDb.from("profiles").select("role").eq("id", user.id).single();

    if (!profile || !["staff", "admin"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Forbidden", role: profile?.role }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { department_id, counter_id, skip } = await req.json();
    if (!department_id || !counter_id) {
      return new Response(JSON.stringify({ error: "department_id and counter_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Look up counter number for notifications
    let counterNumber = counter_id.slice(0, 8);
    try {
      const { data: ctr } = await fetch(supabaseUrl + "/rest/v1/counters?id=eq." + counter_id + "&select=counter_number", {
        headers: { "apikey": serviceKey, "Authorization": "Bearer " + serviceKey, "Accept": "application/json" },
      }).then(r => r.ok ? r.json() : []);
      if (ctr && ctr.length > 0) counterNumber = String(ctr[0].counter_number);
    } catch {}

    // Use anon key with user's JWT for all queries (RLS handles permissions)
    const db = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const today = new Date().toISOString().slice(0, 10);

    // Mark current serving as completed or skipped
    const servingStatus = skip ? "skipped" : "completed";
    const { data: currentServing } = await db
      .from("queue_tickets")
      .select("id")
      .eq("department_id", department_id)
      .eq("counter_id", counter_id)
      .eq("date", today)
      .eq("status", "serving")
      .limit(1);

    if (currentServing && currentServing.length > 0) {
      const ts = new Date().toISOString();
      // Use raw fetch with service key to bypass RLS
      if (serviceKey) {
        const hdrs = { "Content-Type": "application/json", "apikey": serviceKey, "Authorization": "Bearer " + serviceKey, "Prefer": "return=minimal" };
        const r = await fetch(supabaseUrl + "/rest/v1/queue_tickets?id=eq." + currentServing[0].id, {
          method: "PATCH", headers: hdrs,
          body: JSON.stringify({ status: servingStatus, [servingStatus === "completed" ? "completed_at" : "skipped_at"]: ts }),
        });
        if (!r.ok) console.error("Complete raw:", r.status, await r.text());
        else console.log("Complete ok:", currentServing[0].id);
      } else {
        const { error: ce } = await db.from("queue_tickets").update({
          status: servingStatus,
          [servingStatus === "completed" ? "completed_at" : "skipped_at"]: ts,
        }).eq("id", currentServing[0].id);
        if (ce) console.error("Complete err:", ce.message);
      }
    }

    // Pull next waiting ticket (lowest position)
    const { data: nextList } = await db
      .from("queue_tickets")
      .select("*")
      .eq("department_id", department_id)
      .eq("date", today)
      .eq("status", "waiting")
      .order("position", { ascending: true })
      .limit(1);

    if (!nextList || nextList.length === 0) {
      return new Response(JSON.stringify({ ticket: null, message: "Queue empty" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const nextTicket = nextList[0];

    // Mark as serving
    const { data: updated } = await db
      .from("queue_tickets")
      .update({ status: "serving", counter_id, called_at: new Date().toISOString() })
      .eq("id", nextTicket.id)
      .select("*")
      .single();

    // Save in-app notification + send Expo push for called user
    const n1 = await sendNotification(supabaseUrl, serviceKey, nextTicket.user_id, "your_turn", "Your turn!", "Please proceed to Counter " + counterNumber + ". Number " + nextTicket.ticket_number + ".", { ticket_id: nextTicket.id, department_id }); console.log("Notif1:", JSON.stringify(n1));

    // Notify the person now 2nd in line
    const { data: almostList } = await db
      .from("queue_tickets")
      .select("user_id, ticket_number, id")
      .eq("department_id", department_id)
      .eq("date", today)
      .eq("status", "waiting")
      .order("position", { ascending: true })
      .limit(1);

    if (almostList && almostList.length > 0) {
      const n2 = await sendNotification(supabaseUrl, serviceKey, almostList[0].user_id, "almost_your_turn", "Almost your turn!", "Get ready. " + almostList[0].ticket_number + " will be called soon.", { ticket_id: almostList[0].id, department_id }); console.log("Notif2:", JSON.stringify(n2));
    }



async function sendNotification(supabaseUrl: string, svcKey: string, userId: string, type: string, title: string, body: string, data: any) {
  const errors: string[] = [];
  if (!svcKey) { return { errors: ['No svc key'] }; }
  const headers = { "Content-Type": "application/json", "apikey": svcKey, "Authorization": "Bearer " + svcKey };
  try {
    const r = await fetch(supabaseUrl + "/rest/v1/notifications", { method: "POST", headers, body: JSON.stringify({ user_id: userId, type, title, body, data }) });
    if (!r.ok) { const t = await r.text(); errors.push('Insert:' + r.status + ' ' + t.slice(0,100)); }
  } catch (e: any) { errors.push('Insert:' + String(e)); }
  try {
    const r = await fetch(supabaseUrl + "/rest/v1/push_tokens?user_id=eq." + userId + "&is_active=eq.true&select=token", { headers });
    if (!r.ok) { const t = await r.text(); errors.push('Tokens:' + r.status); }
    else {
      const tokens = await r.json();
      if (tokens && tokens.length > 0) {
        const messages = tokens.map((t: any) => ({ to: t.token, sound: "default", title, body, data, channelId: "queue-updates" }));
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(messages),
        });
      }
    }
  } catch (e: any) { errors.push('Push:' + String(e)); }
  return errors.length > 0 ? { errors } : {};
}

    // Return only fields matching queueTicketSchema
    const zod = {
      id: updated.id, ticket_number: updated.ticket_number,
      department_id: updated.department_id, user_id: updated.user_id,
      counter_id: updated.counter_id, status: updated.status,
      position: updated.position, joined_at: updated.joined_at,
      called_at: updated.called_at, completed_at: updated.completed_at,
      cancelled_at: updated.cancelled_at, skipped_at: updated.skipped_at,
      expired_at: updated.expired_at, notes: updated.notes,
      date: updated.date, created_at: updated.created_at,
    };

    return new Response(JSON.stringify(zod), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
