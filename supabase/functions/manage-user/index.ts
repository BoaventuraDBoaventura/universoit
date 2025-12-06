import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin");

    if (rolesError || !roles || roles.length === 0) {
      console.error("User is not admin:", rolesError);
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem gerir utilizadores" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { action, userId, email } = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Ação é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Action:", action, "UserId:", userId, "Email:", email);

    switch (action) {
      case "send_password_reset": {
        if (!email) {
          return new Response(
            JSON.stringify({ error: "Email é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate password reset link
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email: email,
          options: {
            redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}/redefinir-password`,
          },
        });

        if (error) {
          console.error("Error generating reset link:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("Password reset link generated for:", email);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Email de redefinição de password enviado" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "ban_user": {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "ID do utilizador é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prevent self-ban
        if (userId === requestingUser.id) {
          return new Response(
            JSON.stringify({ error: "Não pode desativar a sua própria conta" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: "876600h", // ~100 years (effectively permanent)
        });

        if (error) {
          console.error("Error banning user:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("User banned:", userId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Utilizador desativado com sucesso" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "unban_user": {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "ID do utilizador é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        });

        if (error) {
          console.error("Error unbanning user:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("User unbanned:", userId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Utilizador ativado com sucesso" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_user_status": {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "ID do utilizador é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (error) {
          console.error("Error getting user:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const userAny = userData.user as any;
        return new Response(
          JSON.stringify({ 
            success: true, 
            banned: userAny?.banned_until ? new Date(userAny.banned_until) > new Date() : false,
            banned_until: userAny?.banned_until,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list_users_status": {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
          console.error("Error listing users:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const usersStatus = users.map(u => {
          const userAny = u as any;
          return {
            id: u.id,
            banned: userAny.banned_until ? new Date(userAny.banned_until) > new Date() : false,
          };
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            users: usersStatus,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Ação não reconhecida" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});