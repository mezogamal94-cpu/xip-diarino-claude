// Field names match the mock `properties` array in app-viewer.html
// (line ~1252) so later screens (search/details/account) can reuse this
// without renaming. Fields unused by the reels feed are still included
// since search/details will need them next.

export type Seller = {
  id: string;
  name: string;
  initial: string;
  verified: boolean;
  listings: number;
  followers: number;
  bio: string;
  phone: string;
};

export type MediaItem = {
  type: "video" | "image";
  url: string;
};

export type Purpose = "sale" | "rent";

export type Property = {
  id: string;
  purpose: Purpose;
  type: string; // شقة / فيلا / بنتهاوس / تاون هاوس / تجاري / إداري / طبي / أرض
  title: string;
  shortTitle?: string;
  province: string;
  location: string;
  lat?: number;
  lng?: number;
  price: number;
  area: number;
  rooms: number;
  baths: number;
  reception: number;
  floor?: number;
  payment?: "cash" | "installment";
  negotiable?: boolean;
  finishType?: string;
  status?: "ready" | "building";
  deliveryDate?: string;
  features: string[];
  description: string;
  likes: number;
  saves: number;
  views: number;
  chats: number;
  createdAt: number;
  media: MediaItem[];
  coverImage: string | null;
  music: string | null;
  likedByMe?: boolean;
  pinned?: boolean;
  pinnedAt?: number;
  seller: Seller;
};

export type ReelMode = "video" | "slideshow" | "none";

// ↔ getReelMode() in app-viewer.html
export function getReelMode(p: Property): ReelMode {
  if (!p.media || p.media.length === 0) return "none";
  const hasVideo = p.media.some((m) => m.type === "video");
  const hasImage = p.media.some((m) => m.type === "image");
  if (hasVideo) return "video";
  if (hasImage) return "slideshow";
  return "none";
}

// ↔ fmtPrice() in app-viewer.html
export function fmtPrice(n: number): string {
  return (n || 0).toLocaleString("en-US");
}
