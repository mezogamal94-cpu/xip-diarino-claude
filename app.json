import { useSyncExternalStore } from "react";
import { SavedLive } from "../../data/saved-live-types";

// ↔ `let savedLives = []` in app-viewer.html. myAds moved to
// lib/hooks/useProperties.ts and myRequests moved to lib/hooks/useRequests.ts
// (both real Supabase tables) — savedLives stays local-only for its CRUD
// convenience wrappers (pin/publish/comments-toggle), even though the
// recording lifecycle itself is backed by the `lives` table's columns.

const MAX_PINNED = 3; // ↔ the "الحد الأقصى ٣" check in togglePinLive()

let savedLives: SavedLive[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() {
  return { savedLives };
}

// ↔ the savedEntry push at the end of endBroadcast()
export function addSavedLive(live: SavedLive) {
  savedLives = [live, ...savedLives];
  emit();
}
export function updateSavedLive(id: string, patch: Partial<SavedLive>) {
  savedLives = savedLives.map((l) => (l.id === id ? { ...l, ...patch } : l));
  emit();
}
export function removeSavedLive(id: string) {
  savedLives = savedLives.filter((l) => l.id !== id);
  emit();
}
// ↔ togglePinLive()
export function togglePinLive(id: string): "pinned" | "unpinned" | "limit" {
  const l = savedLives.find((x) => x.id === id);
  if (!l) return "unpinned";
  if (l.pinned) {
    updateSavedLive(id, { pinned: false });
    return "unpinned";
  }
  if (savedLives.filter((x) => x.pinned).length >= MAX_PINNED) return "limit";
  updateSavedLive(id, { pinned: true, pinnedAt: Date.now() });
  return "pinned";
}
// ↔ publishSavedLive()/unpublishSavedLive()
export function toggleSavedLivePublic(id: string) {
  const l = savedLives.find((x) => x.id === id);
  if (!l) return;
  updateSavedLive(id, { publishedPublic: !l.publishedPublic });
}
// ↔ _applyToggleSavedLiveComments()
export function toggleSavedLiveComments(id: string) {
  const l = savedLives.find((x) => x.id === id);
  if (!l) return;
  updateSavedLive(id, { commentsHidden: !l.commentsHidden });
}

export function useMyContent() {
  const snap = useSyncExternalStore(subscribe, getSnapshot);
  return {
    savedLives: snap.savedLives,
    addSavedLive, updateSavedLive, removeSavedLive, togglePinLive, toggleSavedLivePublic, toggleSavedLiveComments,
  };
}
