import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { PropertyRequest } from "../../data/mock-requests";

// ↔ replaces data/mock-requests.ts + the myRequests half of useMyContent.ts.

type RequestRow = {
  id: string; requester_id: string; purpose: "sale" | "rent"; type: string; province: string; location: string;
  price_max: number | null; area: string | null; rooms: string | null; baths: string | null;
  description: string; requester_name: string; offers_count: number; created_at: string;
};

function rowToRequest(row: RequestRow): PropertyRequest {
  return {
    id: row.id,
    purpose: row.purpose,
    type: row.type,
    province: row.province,
    location: row.location,
    priceMax: row.price_max ?? 0,
    area: row.area ?? "",
    rooms: row.rooms ?? "",
    baths: row.baths ?? "",
    description: row.description,
    requesterName: row.requester_name,
    requesterId: row.requester_id,
    offers: row.offers_count,
    createdAt: new Date(row.created_at).getTime(),
  };
}

async function fetchRequests(): Promise<PropertyRequest[]> {
  const { data, error } = await supabase.from("requests").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as RequestRow[]).map(rowToRequest);
}

export function useRequests() {
  return useQuery({ queryKey: ["requests"], queryFn: fetchRequests, staleTime: 15_000 });
}

export function useMyRequests(requesterId: string | undefined) {
  const { data } = useRequests();
  return (data ?? []).filter((r) => r.requesterId === requesterId);
}

export type CreateRequestInput = Omit<PropertyRequest, "id" | "createdAt" | "offers" | "requesterId"> & {
  requesterId: string;
};

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRequestInput) => {
      const { error } = await supabase.from("requests").insert({
        requester_id: input.requesterId,
        purpose: input.purpose, type: input.type, province: input.province, location: input.location,
        price_max: input.priceMax || null, area: input.area || null, rooms: input.rooms || null, baths: input.baths || null,
        description: input.description, requester_name: input.requesterName,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
  });
}

export function useDeleteRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
  });
}

// ↔ the offers++ side of submitOffer() — atomic via the increment_request_offers RPC.
export function useIncrementRequestOffers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc("increment_request_offers", { request_id: requestId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
  });
}
