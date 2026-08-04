import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkIsSuperAdmin } from "@/lib/rbac";
import type { User as SbUser } from "@supabase/supabase-js";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<SbUser | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async (usr: SbUser | null | undefined) => {
      if (!mounted) return;
      setUser(usr ?? null);
      if (!usr) {
        setIsAdmin(false);
        setLoaded(true);
        return;
      }

      const isSuper = checkIsSuperAdmin(usr);
      setIsAdmin(isSuper);
      setLoaded(true);
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

  return { isAdmin, loaded, user };
}
