import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const payload = await req.json()
    const { email, password, first_name, last_name, phone, department, position } = payload

    // Determinar rol por defecto si no se envía
    let role_id: string | null = null
    if (payload?.role_id) {
      role_id = payload.role_id
    } else {
      const { data: defaultRole, error: defaultRoleError } = await supabaseAdmin
        .from('user_roles')
        .select('id, name')
        .eq('name', 'user')
        .single()
      if (!defaultRoleError && defaultRole?.id) {
        role_id = defaultRole.id
      }
    }

    // 1. Create user in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      throw new Error(`Error creating auth user: ${authError.message}`)
    }

    // 2. Create user in system_users
    const { error: systemError } = await supabaseAdmin
      .from('system_users')
      .insert([{
        id: authUser.user.id, // Use same ID as auth.users
        email,
        first_name,
        last_name,
        phone: phone || null,
        department: department || null,
        position: position || null,
        role_id: role_id || null,
        is_active: true
      }])

    if (systemError) {
      // If system_users insert fails, clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Error creating system user: ${systemError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          first_name,
          last_name
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
