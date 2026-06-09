import { createClient } from "npm:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const db = createClient(supabaseUrl, serviceKey || "");

    const { user_id, type, title, body, data } = await req.json();
    if (!user_id || !type || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    // Save in-app notification
    await db.from("notifications").insert({ user_id, type, title, body, data: data ?? {} }).catch(() => {});

    // Get push tokens
    const { data: tokens } = await db
      .from("push_tokens")
      .select("token, platform")
      .eq("user_id", user_id)
      .eq("is_active", true);

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: "Saved, no push tokens" }), { status: 200, headers: corsHeaders });
    }

    // Send via Expo Push API
    const messages = tokens.map((t) => ({
      to: t.token, sound: "default", title, body, data: data ?? {}, channelId: "queue-updates",
    }));

    const pushRes = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    const pushResult = await pushRes.json();

    // Deactivate invalid tokens
    if (pushResult.data) {
      const invalid: string[] = [];
      pushResult.data.forEach((r: any, i: number) => {
        if (r.status === "error" && r.details?.error === "DeviceNotRegistered") invalid.push(tokens[i].token);
      });
      if (invalid.length > 0) {
        await db.from("push_tokens").update({ is_active: false }).in("token", invalid).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ message: "OK", sent: tokens.length }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
