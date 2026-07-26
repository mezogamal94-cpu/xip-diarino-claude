import { useSyncExternalStore } from "react";
import { Chat, ChatMessage, INITIAL_CHATS } from "../../data/mock-chats";

// ↔ `let chats = [...]` + openChat()/openChatWithSeller()/sendChatMessage()
// in app-viewer.html. Kept as a small module-level store (not per-screen
// state) since chats need to be reachable from multiple entry points —
// the chat list, property details, seller profile, and notifications —
// without prop-drilling through the whole navigation tree.

let chats: Chat[] = INITIAL_CHATS;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return chats;
}

export function useChats() {
  const list = useSyncExternalStore(subscribe, getSnapshot);
  return list;
}

export function useChat(chatId: string | undefined) {
  const list = useChats();
  return list.find((c) => c.id === chatId);
}

export function markChatRead(chatId: string) {
  chats = chats.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c));
  emit();
}

// ↔ openChatWithSeller() — finds an existing chat for this property, or
// creates one (seeded with the same greeting message as the original).
export function openOrCreateChat(sellerName: string, sellerInitial: string, propertyId: string): string {
  const existing = chats.find((c) => c.propertyId === propertyId);
  if (existing) return existing.id;

  const id = `c${chats.length + 1}${Math.random().toString(36).slice(2, 5)}`;
  const newChat: Chat = {
    id,
    partnerName: sellerName,
    initial: sellerInitial,
    propertyId,
    unread: 0,
    messages: [{ from: "them", text: "أهلاً بيك! اتفضل اسأل عن أي تفاصيل", time: "الآن" }],
  };
  chats = [newChat, ...chats];
  emit();
  return id;
}

// ↔ submitOffer()'s inline chat creation — offer chats use a fixed
// "req-<requestId>" id (so re-offering on the same request reuses the same
// thread) and have no propertyId, unlike property chats.
export function getOrCreateRequestChat(requestId: string, requesterName: string): Chat {
  const id = `req-${requestId}`;
  const existing = chats.find((c) => c.id === id);
  if (existing) return existing;
  const newChat: Chat = {
    id, partnerName: requesterName, initial: requesterName.charAt(0),
    propertyId: null, unread: 0, messages: [],
  };
  chats = [newChat, ...chats];
  emit();
  return newChat;
}

// ↔ the offer message format in submitOffer(): "بخصوص طلبك (...):\n<msg>"
// plus an optional whatsapp tag, sent as a single 'me' message.
export function sendOfferMessage(chatId: string, text: string, whatsapp: string) {
  const time = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  const message: ChatMessage = { from: "me", text, time, whatsapp };
  chats = chats.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, message] } : c));
  emit();
}

// ↔ sendChatMessage()
export function sendChatMessage(chatId: string, text: string, images: string[] = []) {
  if (!text.trim() && images.length === 0) return;
  const time = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  const message: ChatMessage = { from: "me", text: text.trim(), images, time };
  chats = chats.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, message] } : c));
  emit();
}
