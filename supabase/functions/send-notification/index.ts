// supabase/functions/send-notification/index.ts
// ============================================================
// Send Notification — Edge Function (Internal)
//
// Called by other edge functions (advance-queue, generate-ticket)
// to dispatch push notifications and create in-app notification records.
//
// POST /functions/v1/send-notification
// Body: { user_id, type, title, body, data }
// Auth: Service role (called internally, not by clients directly)
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user_id, type, title, body, data } = await req.json();

    if (!user_id || !type || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'user_id, type, title, and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Save in-app notification record
    const { error: notifError } = await adminClient
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        body,
        data: data ?? {},
      });

    if (notifError) {
      console.error('Failed to save notification:', notifError.message);
    }

    // 2. Get user's active push tokens
    const { data: tokens } = await adminClient
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Notification saved, but no push tokens found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Send push notifications via Expo Push API
    const messages = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title,
      body,
      data: data ?? {},
      channelId: 'queue-updates', // Android notification channel
    }));

    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const pushResult = await pushResponse.json();

    // 4. Deactivate any invalid tokens
    if (pushResult.data) {
      const invalidTokens: string[] = [];
      pushResult.data.forEach((result: any, index: number) => {
        if (result.status === 'error' && result.details?.error === 'DeviceNotRegistered') {
          invalidTokens.push(tokens[index].token);
        }
      });

      if (invalidTokens.length > 0) {
        await adminClient
          .from('push_tokens')
          .update({ is_active: false })
          .in('token', invalidTokens);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Notification sent',
        push_sent: tokens.length,
        push_result: pushResult,
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
