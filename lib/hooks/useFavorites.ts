import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useCurrentUser } from "./useCurrentUser";

// ↔ state.favoriteProperties / state.favoriteRequests (Sets) in
// app-viewer.html — both now backed by the real `favorites` table, shared
// across devices/sessions instead of resetting on every app relaunch.

async function fetchFavoriteIds(userId: string, column: "property_id" | "request_id"): Promise<Set<string>> {
  const { data, error } = await supabase.from("favorites").select(column).eq("user_id", userId).not(column, "is", null);
  if (error) throw error;
  const rows = (data ?? []) as unknown as Record<string, string>[];
  return new Set(rows.map((r) => r[column]));
}

function useFavoriteSet(column: "property_id" | "request_id") {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const queryKey = ["favorites", column, user?.id];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchFavoriteIds(user!.id, column),
    enabled: !!user,
    staleTime: 15_000,
  });

  const toggle = useMutation({
    mutationFn: async (targetId: string) => {
      if (!user) throw new Error("Not signed in");
      const current = query.data ?? new Set<string>();
      if (current.has(targetId)) {
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq(column, targetId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorites").insert({ user_id: user.id, [column]: targetId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  return { ids: query.data ?? new Set<string>(), toggle: (id: string) => toggle.mutate(id) };
}

export function useFavorites() {
  const properties = useFavoriteSet("property_id");
  const requests = useFavoriteSet("request_id");
  return {
    favoriteProperties: properties.ids,
    favoriteRequests: requests.ids,
    totalCount: properties.ids.size + requests.ids.size,
    toggleFavoriteProperty: properties.toggle,
    toggleFavoriteRequest: requests.toggle,
  };
}
