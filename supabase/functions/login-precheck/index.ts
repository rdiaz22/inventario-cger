import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

type PrecheckRequest = {
  email?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Almacenamiento en memoria para rate limiting
const rateLimitStore = new Map<string, { attempts: number; lastAttempt: Date; blockedUntil?: Date }>();

// Simple, pragmatic backoff window strategy
const WINDOW_SECONDS = 300; // 5 minutes window
const MAX_ATTEMPTS = 7; // up to 7 attempts per IP+email per window
const BASE_LOCK_SECONDS = 60; // base lock 1 min, scales with extra attempts

// Limpiar entradas antiguas periódicamente
setInterval(() => {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_SECONDS * 1000);
  
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.lastAttempt < windowStart && (!data.blockedUntil || data.blockedUntil < now)) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Limpiar cada minuto

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

    // Extract caller IP (works behind Vercel/proxies)
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const realIp = req.headers.get("x-real-ip") || "";
    const ip = (forwardedFor.split(",")[0] || realIp || "unknown").trim();

    const key = `${email}:${ip}`;
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_SECONDS * 1000);

    // Get current rate limit data
    const current = rateLimitStore.get(key);
    
    // Check if blocked
    if (current?.blockedUntil && current.blockedUntil > now) {
      const remaining = Math.max(0, Math.ceil((current.blockedUntil.getTime() - now.getTime()) / 1000));
      return new Response(
        JSON.stringify({ ok: false, blocked: true, retryAfterSeconds: remaining }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    // Reset attempts if outside window
    const attempts = (current && current.lastAttempt > windowStart) ? current.attempts + 1 : 1;
    
    // Check if should block
    let blockedUntil: Date | undefined;
    if (attempts > MAX_ATTEMPTS) {
      const extra = attempts - MAX_ATTEMPTS;
      const lockSeconds = BASE_LOCK_SECONDS * Math.min(10, extra);
      blockedUntil = new Date(now.getTime() + lockSeconds * 1000);
    }

    // Update rate limit store
    rateLimitStore.set(key, {
      attempts,
      lastAttempt: now,
      blockedUntil
    });

    return new Response(JSON.stringify({ 
      ok: true, 
      blocked: false,
      attempts,
      maxAttempts: MAX_ATTEMPTS
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Rate limit error:', error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});


