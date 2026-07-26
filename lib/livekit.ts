import { supabase } from "./supabase";

export type LiveKitConnectionInfo = {
  token: string;
  url: string;
  isHost: boolean; // echoed back so the UI knows which controls to show
};

// Calls the `livekit-token` Edge Function with the caller's current
// Supabase session attached automatically by supabase-js. The server looks
// up `lives.host_id` for roomName and decides publish rights itself — this
// function has no `role` param on purpose, so there's nothing here for a
// client to spoof.
export async function fetchLiveKitToken(roomName: string): Promise<LiveKitConnectionInfo> {
  const { data, error } = await supabase.functions.invoke<LiveKitConnectionInfo>("livekit-token", {
    body: { roomName },
  });

  if (error) throw error;
  if (!data?.token || !data?.url) throw new Error("livekit-token function returned an incomplete response");

  return data;
}

// ↔ inserted by the broadcaster BEFORE requesting their own token — RLS
// (`host_id = auth.uid()`) means only the caller can ever create a room
// where they are the host, which is what the token function checks against.
export async function createLiveRoom(roomName: string, title: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Not signed in");

  const { error } = await supabase.from("lives").insert({
    room_name: roomName,
    host_id: userData.user.id,
    title,
    status: "live",
  });
  if (error) throw error;
}

// ↔ called on "إنهاء" (end live) — marks the room ended so nobody (host
// included) can fetch a fresh token for it afterwards (see the 410 check
// in the Edge Function).
export async function endLiveRoom(roomName: string): Promise<void> {
  await supabase.from("lives").update({ status: "ended", ended_at: new Date().toISOString() }).eq("room_name", roomName);
}

// ↔ called right after the broadcaster's stream goes live — starts an
// Egress room-composite recording via the livekit-recording Edge Function.
export async function startRecording(roomName: string): Promise<{ egressId: string }> {
  const { data, error } = await supabase.functions.invoke<{ egressId: string }>("livekit-recording", {
    body: { action: "start", roomName },
  });
  if (error) throw error;
  if (!data?.egressId) throw new Error("livekit-recording did not return an egressId");
  return data;
}

// ↔ called on "إنهاء" (end live) — stops the Egress job. The final
// recording_url shows up later via the livekit-webhook's egress_ended
// handler, not synchronously from this call (encoding/upload takes time).
export async function stopRecording(roomName: string, egressId: string, durationSec: number): Promise<void> {
  const { error } = await supabase.functions.invoke("livekit-recording", {
    body: { action: "stop", roomName, egressId, durationSec },
  });
  if (error) throw error;
}
