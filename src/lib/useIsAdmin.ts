import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SUPER_ADMIN_EMAILS = [
  "habibaali552005@gmail.com",
  "alihabiba109@gmail.com",
  "superadmin@beitak.com",
  "admin@beitak.com",
];

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async (user: { email?: string; id?: string } | null | undefined) => {
      if (!user) {
        if (mounted) {
          setIsAdmin(false);
          setLoaded(true);
        }
        return;
      }

      const email = (user.email || "").toLowerCase();
      if (SUPER_ADMIN_EMAILS.some((e) => e.toLowerCase() === email)) {
        if (mounted) {
          setIsAdmin(true);
          setLoaded(true);
        }
        return;
      }

      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (mounted) {
          setIsAdmin(!!data);
          setLoaded(true);
        }
      } catch {
        if (mounted) {
          setIsAdmin(false);
          setLoaded(true);
        }
      }
    };

    supabase.auth.getSession().then(({ data }) => check(data.session?.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      check(session?.user);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, loaded };
}
