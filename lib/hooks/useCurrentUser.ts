import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../supabase";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const displayName =
    (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || user?.email || "مستخدم";

  return { user, displayName, loading };
}
