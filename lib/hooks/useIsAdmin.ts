import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useCurrentUser } from "./useCurrentUser";

// ↔ checkAdmin(uid) — queries user_roles for an 'admin' row matching the
// current user. Granting the role itself is a manual/server-side action
// (see the migration's comment) — this hook only ever reads.
export function useIsAdmin() {
  const { user, loading: userLoading } = useCurrentUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) { setIsAdmin(false); setChecking(false); return; }

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        setIsAdmin(!!data);
        setChecking(false);
      });
  }, [user, userLoading]);

  return { isAdmin, checking: checking || userLoading };
}
