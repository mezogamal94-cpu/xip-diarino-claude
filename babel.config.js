import { useSyncExternalStore } from "react";
import { NOTIF_DATA, NotifCategory, NotifItem } from "../../data/mock-notifications";

export type NotifFilter = "all" | "read" | "unread";

// ↔ NOTIF_DATA / notifActiveCat / notifFilter / updateNotifBadges() in
// app-viewer.html. Moved to a module-level store (like useChats.ts) instead
// of per-screen state — the notif badge on the header bell has to reflect
// the same unread count no matter which tab it's rendered on.

let data: Record<NotifCategory, NotifItem[]> = NOTIF_DATA;
let activeCat: NotifCategory = "like";
let filter: NotifFilter = "all";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function computeBadges(): Record<NotifCategory, number> {
  const out: Record<NotifCategory, number> = { like: 0, save: 0, follow: 0, chat: 0 };
  (Object.keys(data) as NotifCategory[]).forEach((c) => {
    out[c] = data[c].filter((n) => !n.read).length;
  });
  return out;
}

export function setActiveCat(cat: NotifCategory) {
  activeCat = cat;
  emit();
}
export function setFilter(f: NotifFilter) {
  filter = f;
  emit();
}
export function markItemRead(cat: NotifCategory, index: number) {
  const list = [...data[cat]];
  if (!list[index] || list[index].read) return;
  list[index] = { ...list[index], read: true };
  data = { ...data, [cat]: list };
  emit();
}
export function markAllRead() {
  data = { ...data, [activeCat]: data[activeCat].map((n) => ({ ...n, read: true })) };
  emit();
}

function getSnapshot() {
  return { data, activeCat, filter };
}

export function useNotifications() {
  const snap = useSyncExternalStore(subscribe, getSnapshot);
  const badges = computeBadges();
  const totalUnread = (Object.values(badges) as number[]).reduce((a, b) => a + b, 0);
  const list = snap.data[snap.activeCat] || [];
  const visibleItems = snap.filter === "all" ? list : list.filter((n) => (snap.filter === "unread" ? !n.read : n.read));

  return {
    activeCat: snap.activeCat,
    setActiveCat,
    filter: snap.filter,
    setFilter,
    badges,
    totalUnread,
    visibleItems,
    markItemRead,
    markAllRead,
  };
}
