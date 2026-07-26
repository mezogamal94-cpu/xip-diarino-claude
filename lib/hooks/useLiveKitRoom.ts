import { useCallback, useEffect, useState } from "react";
import { useRoomContext } from "@livekit/react-native";
import { RoomEvent } from "livekit-client";
import { fetchLiveKitToken, LiveKitConnectionInfo } from "../livekit";
import { LiveComment } from "../../components/live/LiveCommentsOverlay";

// Fetch the token/url pair BEFORE mounting <LiveKitRoom> — the component
// needs both up front as props, unlike the web version where getUserMedia
// + the socket connect happened imperatively inside one long function.
// No `role` param here on purpose — the server decides publish rights by
// checking `lives.host_id` against the caller, not by trusting a client flag.
export function useLiveKitToken(roomName: string) {
  const [info, setInfo] = useState<LiveKitConnectionInfo | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!roomName) return;
    let cancelled = false;
    fetchLiveKitToken(roomName)
      .then((res) => { if (!cancelled) setInfo(res); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err : new Error(String(err))); });
    return () => { cancelled = true; };
  }, [roomName]);

  return { info, error, ready: !!info };
}

const decoder = new TextDecoder();
const encoder = new TextEncoder();

// ↔ liveComments[id] + sendLiveComment()/tickLiveSim() in app-viewer.html,
// now backed by LiveKit's reliable data channel instead of a local mock array.
// Must be called from a component rendered *inside* <LiveKitRoom>.
export function useLiveComments(displayName: string) {
  const room = useRoomContext();
  const [comments, setComments] = useState<LiveComment[]>([]);

  useEffect(() => {
    if (!room) return;
    const onData = (payload: Uint8Array, participant?: { name?: string }) => {
      try {
        const msg = JSON.parse(decoder.decode(payload)) as { text: string };
        setComments((prev) => [
          ...prev,
          { id: `${Date.now()}-${Math.random()}`, name: participant?.name || "زائر", text: msg.text },
        ]);
      } catch {
        // ignore malformed payloads
      }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => { room.off(RoomEvent.DataReceived, onData); };
  }, [room]);

  const sendComment = useCallback(
    (text: string) => {
      if (!room) return;
      // Echo locally immediately so the sender isn't waiting on their own round trip.
      setComments((prev) => [...prev, { id: `${Date.now()}-local`, name: displayName, text }]);
      room.localParticipant.publishData(encoder.encode(JSON.stringify({ text })), {
        reliable: true,
        topic: "comment",
      });
    },
    [room, displayName]
  );

  return { comments, sendComment };
}
