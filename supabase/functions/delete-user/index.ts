import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate Auth: require a valid JWT and admin role
    const authHeader = req.headers.get('authorization') || ''
    const jwt = authHeader.replace('Bearer ', '')

    if (!jwt) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false, autoRefreshToken: false }
      }
    )

    const { data: caller, error: callerError } = await supabaseUser.auth.getUser()
    if (callerError || !caller?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    const { data: roleRows, error: roleError } = await supabaseAdmin
      .from('system_users')
      .select('id, role_id, user_roles:role_id(permissions)')
      .eq('id', caller.user.id)
      .limit(1)
      .maybeSingle()

    if (roleError || !roleRows || !(roleRows as any).user_roles?.permissions) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    const perms = (roleRows as any).user_roles.permissions || {}
    const isAdmin = Boolean(perms.all || perms.users)
    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    const payload = await req.json();
    const userId: string = payload?.user_id || payload?.id;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id es requerido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Intentar borrar primero el registro extendido; si no existe, continuar
    const { error: systemDeleteError } = await supabaseAdmin
      .from('system_users')
      .delete()
      .eq('id', userId);

    if (systemDeleteError && systemDeleteError.code !== 'PGRST116') {
      // PGRST116: No rows found or similar; permitimos continuar
      // Para cualquier otro error devolvemos fallo
      return new Response(
        JSON.stringify({ success: false, error: `Error al eliminar en system_users: ${systemDeleteError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Borrar también en auth.users (esto, con ON DELETE CASCADE, podría bastar)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      return new Response(
        JSON.stringify({ success: false, error: `Error al eliminar usuario de auth: ${authDeleteError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});



