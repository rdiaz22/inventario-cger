import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PrecheckRequest = {
  email?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WINDOW_SECONDS = 300;
const MAX_ATTEMPTS = 7;
const BASE_LOCK_SECONDS = 60;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as PrecheckRequest;
    const email = (body?.email || "").trim().toLowerCase();
    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: "email_required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const realIp = req.headers.get("x-real-ip") || "";
    const ip = (forwardedFor.split(",")[0] || realIp || "unknown").trim();
    const key = `${email}:${ip}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ ok: false, error: "missing_service_config" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${serviceKey}` } },
    });

    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_SECONDS * 1000).toISOString();

    const { data: rows, error: readErr } = await admin
      .from("auth_rate_limits")
      .select("key, attempts, blocked_until, last_attempt")
      .eq("key", key)
      .gte("last_attempt", windowStart)
      .order("last_attempt", { ascending: false })
      .limit(1);
    if (readErr) throw readErr;

    const current = rows?.[0] as
      | { key: string; attempts: number; blocked_until: string | null; last_attempt: string }
      | undefined;

    const blockedUntil = current?.blocked_until ? new Date(current.blocked_until) : null;
    const isBlocked = blockedUntil ? blockedUntil.getTime() > now.getTime() : false;
    if (isBlocked) {
      const remaining = Math.max(0, Math.ceil((blockedUntil!.getTime() - now.getTime()) / 1000));
      return new Response(
        JSON.stringify({ ok: false, blocked: true, retryAfterSeconds: remaining }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    const attempts = (current?.attempts || 0) + 1;
    let newBlockedUntil: string | null = null;
    if (attempts > MAX_ATTEMPTS) {
      const extra = attempts - MAX_ATTEMPTS;
      const lockSeconds = BASE_LOCK_SECONDS * Math.min(10, extra);
      newBlockedUntil = new Date(now.getTime() + lockSeconds * 1000).toISOString();
    }

    const upsertPayload = {
      key,
      attempts,
      last_attempt: now.toISOString(),
      blocked_until: newBlockedUntil,
      meta: { ip, email },
    } as const;

    const { error: upsertErr } = await admin
      .from("auth_rate_limits")
      .upsert(upsertPayload, { onConflict: "key" });
    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ ok: true, blocked: false, attempts, maxAttempts: MAX_ATTEMPTS }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});


