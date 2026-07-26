import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  seedAdminDB, AdminReel, AdminLive, AdminReport, AdminUser, AdminFeature, CityStat, ReelStatus, LiveStatus,
} from "../../data/mock-admin";

// ↔ DB_KEY / load() / save() in admin-viewer.html — same persisted-mock-DB
// pattern, AsyncStorage instead of localStorage. NOTE: this is still a
// local mock database, same as the original (there was never a real
// backend behind the admin panel) — wiring this to actual Supabase queries
// over real reels/lives/reports/users is a separate, larger piece of work
// (the "real backend persistence" gap flagged earlier in this project).

const STORAGE_KEY = "diarino:admin_db_v1";

type AdminDB = {
  reels: AdminReel[]; lives: AdminLive[]; reports: AdminReport[];
  users: AdminUser[]; features: AdminFeature[]; cityStats: CityStat[];
};

let db: AdminDB = seedAdminDB();
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() {
  return db;
}
function persist() {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db)).catch(() => {});
}

AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
  if (saved) {
    try { db = JSON.parse(saved); } catch { /* fall back to seed */ }
  } else {
    persist();
  }
  loaded = true;
  emit();
}).catch(() => { loaded = true; });

export function isAdminDBLoaded() {
  return loaded;
}

// ↔ setReel()
export function setReelStatus(id: string, status: ReelStatus) {
  db = { ...db, reels: db.reels.map((r) => (r.id === id ? { ...r, status } : r)) };
  persist(); emit();
}
// ↔ delReel()
export function deleteReel(id: string) {
  db = { ...db, reels: db.reels.filter((r) => r.id !== id) };
  persist(); emit();
}
// ↔ setLive()
export function setLiveStatus(id: string, status: LiveStatus) {
  db = { ...db, lives: db.lives.map((l) => (l.id === id ? { ...l, status } : l)) };
  persist(); emit();
}
// ↔ delLive()
export function deleteLive(id: string) {
  db = { ...db, lives: db.lives.filter((l) => l.id !== id) };
  persist(); emit();
}
// ↔ the reports page's implicit "resolve" action (dismiss after action taken)
export function resolveReport(id: string) {
  db = { ...db, reports: db.reports.filter((r) => r.id !== id) };
  persist(); emit();
}
export function toggleUserActive(id: string) {
  db = { ...db, users: db.users.map((u) => (u.id === id ? { ...u, active: !u.active } : u)) };
  persist(); emit();
}
export function toggleUserPerm(id: string, perm: keyof AdminUser["perms"]) {
  db = {
    ...db,
    users: db.users.map((u) => (u.id === id ? { ...u, perms: { ...u.perms, [perm]: !u.perms[perm] } } : u)),
  };
  persist(); emit();
}
export function toggleFeature(key: string) {
  db = { ...db, features: db.features.map((f) => (f.key === key ? { ...f, on: !f.on } : f)) };
  persist(); emit();
}

export function useAdminDB() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
