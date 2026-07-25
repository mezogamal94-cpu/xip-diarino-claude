import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { Property, MediaItem, Purpose } from "../types";
import { properties as demoProperties } from "../../data/mock-properties";

// ↔ replaces data/mock-properties.ts as the live source of truth. The demo
// array is still imported and merged in below (see useProperties()) rather
// than deleted outright — it's genuinely useful seed content for a fresh
// install with zero real listings yet, and re-seeding it as fake DB rows
// isn't possible without violating the seller_id → auth.users FK (see the
// migration's note). Real listings always come from Supabase; demo ones
// never can be edited/deleted since no real seller_id matches them.

type ProfileRow = { id: string; full_name: string | null; phone: string | null; bio: string | null; avatar_url: string | null; verified: boolean };
type PropertyRow = {
  id: string; seller_id: string; purpose: Purpose; type: string; title: string; short_title: string | null;
  province: string; location: string; lat: number | null; lng: number | null; price: number; area: number;
  rooms: number; baths: number; reception: number; floor: number | null; payment: string | null;
  negotiable: boolean | null; finish_type: string | null; status: string | null; delivery_date: string | null;
  features: string[]; description: string; media: MediaItem[]; cover_image: string | null; music: string | null;
  pinned: boolean; pinned_at: string | null; likes: number; saves: number; views: number; chats: number;
  created_at: string; profiles: ProfileRow | null;
};

function rowToProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    purpose: row.purpose,
    type: row.type,
    title: row.title,
    shortTitle: row.short_title ?? undefined,
    province: row.province,
    location: row.location,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    price: Number(row.price),
    area: Number(row.area),
    rooms: row.rooms,
    baths: row.baths,
    reception: row.reception,
    floor: row.floor ?? undefined,
    payment: (row.payment as "cash" | "installment") ?? undefined,
    negotiable: row.negotiable ?? undefined,
    finishType: row.finish_type ?? undefined,
    status: (row.status as "ready" | "building") ?? undefined,
    deliveryDate: row.delivery_date ?? undefined,
    features: row.features || [],
    description: row.description || "",
    media: row.media || [],
    coverImage: row.cover_image,
    music: row.music,
    pinned: row.pinned,
    pinnedAt: row.pinned_at ? new Date(row.pinned_at).getTime() : undefined,
    likes: row.likes, saves: row.saves, views: row.views, chats: row.chats,
    createdAt: new Date(row.created_at).getTime(),
    seller: {
      id: row.seller_id,
      name: row.profiles?.full_name || "مستخدم ديار توك",
      initial: (row.profiles?.full_name || "د").charAt(0),
      verified: row.profiles?.verified || false,
      listings: 0, // computed separately on the seller profile screen, not worth a join here
      followers: 0, // no followers table yet
      bio: row.profiles?.bio || "",
      phone: row.profiles?.phone || "",
    },
  };
}

const SELECT = "*, profiles!properties_seller_profile_fkey(*)";

async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabase.from("properties").select(SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as PropertyRow[]).map(rowToProperty);
}

async function fetchPropertiesBySeller(sellerId: string): Promise<Property[]> {
  const { data, error } = await supabase.from("properties").select(SELECT).eq("seller_id", sellerId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as PropertyRow[]).map(rowToProperty);
}

// ↔ properties feed for reels/search — real listings first, demo content
// appended after so it never buries someone's actual published property.
export function useProperties() {
  const query = useQuery({ queryKey: ["properties"], queryFn: fetchProperties, staleTime: 30_000 });
  const all = [...(query.data ?? []), ...demoProperties];
  return { ...query, properties: all };
}

export function usePropertyById(id: string | undefined) {
  const { properties } = useProperties();
  return properties.find((p) => p.id === id);
}

// ↔ myAds in useMyContent.ts — real listings only, no demo content mixed in.
export function useMyProperties(sellerId: string | undefined) {
  return useQuery({
    queryKey: ["properties", "bySeller", sellerId],
    queryFn: () => fetchPropertiesBySeller(sellerId!),
    enabled: !!sellerId,
    staleTime: 10_000,
  });
}

export type CreatePropertyInput = Omit<Property, "id" | "createdAt" | "likes" | "saves" | "views" | "chats" | "seller" | "pinned" | "pinnedAt"> & {
  sellerId: string;
};

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePropertyInput) => {
      const { data, error } = await supabase.from("properties").insert({
        seller_id: input.sellerId,
        purpose: input.purpose, type: input.type, title: input.title, short_title: input.shortTitle,
        province: input.province, location: input.location, lat: input.lat, lng: input.lng,
        price: input.price, area: input.area, rooms: input.rooms, baths: input.baths, reception: input.reception,
        floor: input.floor, payment: input.payment, negotiable: input.negotiable, finish_type: input.finishType,
        status: input.status, delivery_date: input.deliveryDate, features: input.features, description: input.description,
        media: input.media, cover_image: input.coverImage, music: input.music,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CreatePropertyInput> }) => {
      const row: Record<string, unknown> = {};
      if (patch.purpose !== undefined) row.purpose = patch.purpose;
      if (patch.type !== undefined) row.type = patch.type;
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.shortTitle !== undefined) row.short_title = patch.shortTitle;
      if (patch.province !== undefined) row.province = patch.province;
      if (patch.location !== undefined) row.location = patch.location;
      if (patch.price !== undefined) row.price = patch.price;
      if (patch.area !== undefined) row.area = patch.area;
      if (patch.rooms !== undefined) row.rooms = patch.rooms;
      if (patch.baths !== undefined) row.baths = patch.baths;
      if (patch.reception !== undefined) row.reception = patch.reception;
      if (patch.floor !== undefined) row.floor = patch.floor;
      if (patch.payment !== undefined) row.payment = patch.payment;
      if (patch.negotiable !== undefined) row.negotiable = patch.negotiable;
      if (patch.finishType !== undefined) row.finish_type = patch.finishType;
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.deliveryDate !== undefined) row.delivery_date = patch.deliveryDate;
      if (patch.features !== undefined) row.features = patch.features;
      if (patch.description !== undefined) row.description = patch.description;
      if (patch.media !== undefined) row.media = patch.media;
      if (patch.coverImage !== undefined) row.cover_image = patch.coverImage;
      if (patch.music !== undefined) row.music = patch.music;
      row.updated_at = new Date().toISOString();

      const { error } = await supabase.from("properties").update(row).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useTogglePinProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from("properties").update({ pinned, pinned_at: pinned ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}
