import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, fullName, adminSecret } = await req.json();

    // Validate required fields
    if (!email || !password || !fullName || !adminSecret) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin secret
    const expectedSecret = Deno.env.get('ADMIN_SETUP_SECRET');
    if (adminSecret !== expectedSecret) {
      console.error('Invalid admin secret provided');
      return new Response(
        JSON.stringify({ error: 'Invalid admin secret' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
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

    // Create the user account
    const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (signUpError) {
      console.error('Error creating user:', signUpError);
      
      // Provide user-friendly error messages
      let errorMessage = signUpError.message;
      if (signUpError.message.includes('already been registered')) {
        errorMessage = 'This email is already registered. Please use a different email address or sign in with your existing account.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userData.user) {
      console.error('No user data returned');
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Assign admin role using service role (bypasses RLS)
    const { error: adminRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' });

    if (adminRoleError) {
      console.error('Error assigning admin role:', adminRoleError);
      // Clean up the user if role assignment fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: 'Failed to assign admin role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign seller role as well
    const { error: sellerRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'seller' });

    if (sellerRoleError) {
      console.error('Error assigning seller role:', sellerRoleError);
      // Note: We don't fail the request if seller role fails, admin role is primary
    }

    console.log(`Admin account created successfully for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Admin account created successfully',
        userId: userId 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in register-admin function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
