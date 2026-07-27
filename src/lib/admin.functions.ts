import { createServerFn } from "@tanstack/react-start";

export const ensureDbAdminRole = createServerFn({ method: "POST" })
  .validator((data: { email: string; userId: string }) => data)
  .handler(async ({ data: { email, userId } }) => {
    const lowercaseEmail = email.toLowerCase();
    const isAllowed =
      lowercaseEmail === "habibaali552005@gmail.com" || lowercaseEmail === "alihabiba109@gmail.com";

    if (!isAllowed) {
      throw new Error("Unauthorized email");
    }

    // Gracefully handle case where Supabase is not connected in the current environment
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasSupabaseEnv =
      url && key && url !== "undefined" && key !== "undefined" && url !== "null" && key !== "null";

    if (!hasSupabaseEnv) {
      console.warn(
        "[Admin Server Function] Supabase variables missing. Skipping real database role assignment.",
      );
      return { success: false, reason: "Supabase not connected" };
    }

    // Import supabaseAdmin dynamically to avoid importing it in client-side bundles
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check if the user already has the admin role
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!existing) {
      console.log(`[Admin Server Function] Assigning admin role to user_id ${userId} (${email})`);
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      if (error) {
        console.error("[Admin Server Function] Error inserting admin role:", error);
        throw new Error("Failed to insert admin role: " + error.message);
      }
    }

    return { success: true };
  });
