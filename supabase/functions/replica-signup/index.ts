// =============================================================
// TEMPORARY SYNC LOGIC — Cross-app user replication endpoint
// This endpoint allows other Zebvo apps to replicate user signups.
// Remove once unified auth (SSO / shared DB) is implemented.
// =============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-zebvo-internal",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Simple internal protection ---
  const internalHeader = req.headers.get("x-zebvo-internal");
  if (internalHeader !== "true") {
    console.warn("Rejected replica-signup: missing x-zebvo-internal header");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "email and password are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user already exists by listing users with this email
    const { data: existingUsers, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("Error listing users:", listError.message);
      return new Response(
        JSON.stringify({ error: "Internal error checking user" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userExists = existingUsers.users.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (userExists) {
      console.log(`Replica signup: user ${email} already exists — skipping`);
      return new Response(
        JSON.stringify({ status: "exists", message: "User already exists" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create user with auto-confirm (no email verification for replicas)
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm since they verified on the originating app
      });

    if (createError) {
      // Handle race condition: user might have been created between check and create
      if (createError.message?.includes("already been registered")) {
        console.log(`Replica signup: user ${email} created concurrently — OK`);
        return new Response(
          JSON.stringify({ status: "exists", message: "User already exists" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.error("Error creating replica user:", createError.message);
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Replica signup: created user ${email} (${newUser.user.id})`);
    return new Response(
      JSON.stringify({ status: "created", userId: newUser.user.id }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Replica signup error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
