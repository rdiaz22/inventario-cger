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

// Simple, pragmatic backoff window strategy
const WINDOW_SECONDS = 300; // 5 minutes window
const MAX_ATTEMPTS = 7; // up to 7 attempts per IP+email per window
const BASE_LOCK_SECONDS = 60; // base lock 1 min, scales with extra attempts

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = (await req.json().catch(() => ({}))) as PrecheckRequest;
    const email = (body?.email || "").trim().toLowerCase();
    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: "email_required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Extract caller IP (works behind Vercel/proxies)
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const realIp = req.headers.get("x-real-ip") || "";
    const ip = (forwardedFor.split(",")[0] || realIp || "unknown").trim();

    const key = `${email}:${ip}`;
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_SECONDS * 1000).toISOString();

    // Read recent attempts in window
    const { data: rows, error: readErr } = await supabaseAdmin
      .from("auth_rate_limits")
      .select("id, attempts, blocked_until, last_attempt")
      .eq("key", key)
      .gte("last_attempt", windowStart)
      .order("last_attempt", { ascending: false })
      .limit(1);

    if (readErr) throw readErr;

    const current = rows?.[0];
    const blockedUntil = current?.blocked_until ? new Date(current.blocked_until) : null;
    const isBlocked = blockedUntil ? blockedUntil.getTime() > now.getTime() : false;

    if (isBlocked) {
      const remaining = Math.max(0, Math.ceil((blockedUntil!.getTime() - now.getTime()) / 1000));
      return new Response(
        JSON.stringify({ ok: false, blocked: true, retryAfterSeconds: remaining }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    // Not blocked -> record one attempt and possibly block
    const attempts = (current?.attempts || 0) + 1;
    let newBlockedUntil: string | null = null;
    if (attempts > MAX_ATTEMPTS) {
      const extra = attempts - MAX_ATTEMPTS; // 1,2,3...
      const lockSeconds = BASE_LOCK_SECONDS * Math.min(10, extra); // step up to 10 minutes
      newBlockedUntil = new Date(now.getTime() + lockSeconds * 1000).toISOString();
    }

    const upsertPayload = {
      key,
      attempts,
      last_attempt: now.toISOString(),
      blocked_until: newBlockedUntil,
      meta: { ip, email },
    } as const;

    const { error: upsertErr } = await supabaseAdmin
      .from("auth_rate_limits")
      .upsert(upsertPayload, { onConflict: "key" });
    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ ok: true, blocked: false }), {
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


