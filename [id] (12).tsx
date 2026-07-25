import { useMemo, useState } from "react";
import { router } from "expo-router";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import {
  LiveKitRoom,
  useTracks,
  useParticipants,
  useRoomContext,
  useIsMuted,
  VideoTrack,
  isTrackReference,
  AudioSession,
} from "@livekit/react-native";
import { Track } from "livekit-client";
import { useEffect } from "react";
import Svg, { Path } from "react-native-svg";
import { PermissionGate } from "../../components/live/PermissionGate";
import { LiveCommentsOverlay } from "../../components/live/LiveCommentsOverlay";
import { useLiveKitToken, useLiveComments } from "../../lib/hooks/useLiveKitRoom";
import { createLiveRoom, endLiveRoom, startRecording, stopRecording } from "../../lib/livekit";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { useLanguage } from "../../lib/hooks/useLanguage";
import { addSavedLive } from "../../lib/hooks/useMyContent";
import { useRef } from "react";

const MAX_TITLE_WORDS = 5; // ↔ mandatory 5-word max broadcast title

export default function BroadcastScreen() {
  return (
    <PermissionGate>
      <BroadcastFlow />
    </PermissionGate>
  );
}

function BroadcastFlow() {
  const { user, displayName } = useCurrentUser();
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [phase, setPhase] = useState<"setup" | "starting" | "live">("setup");
  const [startError, setStartError] = useState<Error | null>(null);

  const roomName = useMemo(() => `live_${user?.id ?? "anon"}_${Date.now()}`, [user?.id]);
  const wordCount = title.trim().length ? title.trim().split(/\s+/).length : 0;
  const titleValid = wordCount > 0 && wordCount <= MAX_TITLE_WORDS;

  const { info, error, ready } = useLiveKitToken(phase === "live" || phase === "starting" ? roomName : "");

  async function startBroadcast() {
    setPhase("starting");
    setStartError(null);
    try {
      // Must succeed BEFORE we ever ask for a token — this is the row the
      // Edge Function checks host_id against to grant publish rights.
      await createLiveRoom(roomName, title.trim());
      setPhase("live");
    } catch (err) {
      setStartError(err instanceof Error ? err : new Error(String(err)));
      setPhase("setup");
    }
  }

  if (phase === "setup" || phase === "starting") {
    return (
      <View style={styles.setupContainer}>
        <Text style={styles.setupTitle}>{t("بث مباشر")}</Text>
        <Text style={styles.setupLabel}>{t("عنوان اللايف")} (٥ {t("كلمات")} كحد أقصى)</Text>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder={t("فيلا مميزة بالتجمع الخامس")}
          placeholderTextColor="#9ca3af"
          maxLength={80}
          editable={phase === "setup"}
        />
        <Text style={[styles.wordCount, !titleValid && wordCount > 0 && styles.wordCountError]}>
          {wordCount}/{MAX_TITLE_WORDS} {t("كلمات")}
        </Text>
        {startError && <Text style={styles.wordCountError}>{startError.message}</Text>}
        <Pressable
          style={[styles.goLiveBtn, (!titleValid || phase === "starting") && styles.goLiveBtnDisabled]}
          disabled={!titleValid || phase === "starting"}
          onPress={startBroadcast}
        >
          <Text style={styles.goLiveBtnText}>{phase === "starting" ? t("جارٍ البدء...") : t("ابدأ البث")}</Text>
        </Pressable>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.setupContainer}>
        <Text style={styles.setupTitle}>{t("تعذر بدء البث")}</Text>
        <Text style={styles.wordCountError}>{error.message}</Text>
        <Pressable style={styles.goLiveBtn} onPress={() => setPhase("setup")}>
          <Text style={styles.goLiveBtnText}>{t("رجوع")}</Text>
        </Pressable>
      </View>
    );
  }

  if (!ready || !info) return null; // brief token-fetch flash, no spinner needed for ~1 request

  return (
    <LiveKitRoom serverUrl={info.url} token={info.token} connect video={info.isHost} audio={info.isHost}>
      <BroadcasterLiveView
        title={title}
        displayName={displayName}
        userId={user?.id ?? "me"}
        roomName={roomName}
        onEnd={() => {
          endLiveRoom(roomName);
          router.back();
        }}
      />
    </LiveKitRoom>
  );
}

function BroadcasterLiveView({
  title, displayName, userId, roomName, onEnd,
}: { title: string; displayName: string; userId: string; roomName: string; onEnd: () => void }) {
  const { t } = useLanguage();
  const room = useRoomContext();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera]);
  const localTrackRef = tracks.find((tr) => tr.participant.isLocal && isTrackReference(tr));
  const { comments, sendComment } = useLiveComments(displayName);
  const isMuted = useIsMuted({ source: Track.Source.Microphone, participant: room?.localParticipant });

  const startedAtRef = useRef(Date.now());
  const peakViewersRef = useRef(0);
  const egressIdRef = useRef<string | null>(null);
  const [recordingStarted, setRecordingStarted] = useState(false);

  useEffect(() => {
    AudioSession.startAudioSession();
    return () => { AudioSession.stopAudioSession(); };
  }, []);

  useEffect(() => {
    // ↔ endBroadcast() historically had nothing to kick off here — this is
    // new: fires once, right after the room is actually live, so the
    // recording covers the stream from (as close to) the start as possible.
    startRecording(roomName)
      .then(({ egressId }) => { egressIdRef.current = egressId; setRecordingStarted(true); })
      .catch((err) => console.warn("Failed to start Egress recording:", err));
  }, [roomName]);

  useEffect(() => {
    const current = Math.max(0, participants.length - 1);
    if (current > peakViewersRef.current) peakViewersRef.current = current;
  }, [participants.length]);

  function toggleMic() {
    room?.localParticipant.setMicrophoneEnabled(isMuted);
  }

  async function flipCamera() {
    if (!room) return;
    // ↔ switchCamera() — republish with the opposite facing mode.
    await room.localParticipant.setCameraEnabled(false);
    await room.localParticipant.setCameraEnabled(true);
  }

  async function endLive() {
    const durationSec = Math.round((Date.now() - startedAtRef.current) / 1000);

    if (egressIdRef.current) {
      try {
        await stopRecording(roomName, egressIdRef.current, durationSec);
      } catch (err) {
        console.warn("Failed to stop Egress recording:", err);
      }
    }

    // ↔ endBroadcast()'s savedEntry push. recordingStatus starts
    // 'processing' (or 'failed' if Egress never actually started) —
    // lib/hooks/useLiveRecordingStatus.ts picks up 'ready' once the
    // livekit-webhook's egress_ended handler fires.
    addSavedLive({
      id: `live_${Date.now()}`,
      roomName,
      title,
      seller: {
        id: userId, name: displayName, initial: displayName.charAt(0),
        verified: false, listings: 0, followers: 0, bio: "", phone: "",
      },
      createdAt: Date.now(),
      durationSec,
      posterUrl: null,
      publishedPublic: false,
      commentsHidden: false,
      viewerPeak: peakViewersRef.current,
      egressId: egressIdRef.current ?? undefined,
      recordingStatus: egressIdRef.current ? "processing" : "failed",
      recordingUrl: null,
    });
    room?.disconnect();
    onEnd();
  }

  return (
    <View style={styles.liveContainer}>
      {localTrackRef && isTrackReference(localTrackRef) ? (
        <VideoTrack trackRef={localTrackRef} style={styles.video} />
      ) : (
        <View style={[styles.video, { backgroundColor: "#111" }]} />
      )}

      <View style={styles.liveTopBar}>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>{t("بث مباشر")}</Text>
        </View>
        {recordingStarted && (
          <View style={styles.recPill}>
            <Text style={styles.recPillText}>● REC</Text>
          </View>
        )}
        <View style={styles.viewerPill}>
          <Text style={styles.viewerPillText}>👁 {Math.max(0, participants.length - 1)}</Text>
        </View>
        <Pressable style={styles.endBtn} onPress={endLive}>
          <Text style={styles.endBtnText}>{t("إنهاء البث")}</Text>
        </Pressable>
      </View>

      <View style={styles.titlePill}>
        <Text style={styles.titlePillText}>📢 {t(title)}</Text>
      </View>

      <View style={styles.controlsRow}>
        <Pressable style={styles.controlBtn} onPress={toggleMic}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            {isMuted ? (
              <Path d="M1 1l22 22M12 1a3 3 0 013 3v6M19 10v2a7 7 0 01-11 5.6M5 10v2a7 7 0 001.5 4.4M12 19v4M8 23h8" />
            ) : (
              <Path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
            )}
          </Svg>
        </Pressable>
        <Pressable style={styles.controlBtn} onPress={flipCamera}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            <Path d="M23 4v6h-6M1 20v-6h6" />
            <Path d="M3.5 9a9 9 0 0114.5-3.5L23 10M1 14l5 5a9 9 0 0014.5-3.5" />
          </Svg>
        </Pressable>
      </View>

      <LiveCommentsOverlay comments={comments} onSend={sendComment} />
    </View>
  );
}

const styles = StyleSheet.create({
  setupContainer: { flex: 1, backgroundColor: "#0b0b0b", padding: 24, justifyContent: "center", gap: 10 },
  setupTitle: { color: "white", fontSize: 20, fontWeight: "900", marginBottom: 12, textAlign: "center" },
  setupLabel: { color: "#9ca3af", fontSize: 13, fontWeight: "700" },
  titleInput: {
    backgroundColor: "#1a1a1a", color: "white", borderRadius: 12, padding: 14, fontSize: 15,
    borderWidth: 1, borderColor: "#2a2a2a",
  },
  wordCount: { color: "#9ca3af", fontSize: 12, textAlign: "right" },
  wordCountError: { color: "#ef4444" },
  goLiveBtn: { marginTop: 16, backgroundColor: "#22A652", borderRadius: 999, paddingVertical: 14, alignItems: "center" },
  goLiveBtnDisabled: { backgroundColor: "#374151" },
  goLiveBtnText: { color: "white", fontWeight: "900", fontSize: 15 },

  liveContainer: { flex: 1, backgroundColor: "#000" },
  video: { flex: 1 },
  liveTopBar: { position: "absolute", top: 50, left: 14, right: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#ef4444", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "white" },
  livePillText: { color: "white", fontSize: 11, fontWeight: "900" },
  recPill: { backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  recPillText: { color: "#ef4444", fontSize: 10, fontWeight: "900" },
  viewerPill: { backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  viewerPillText: { color: "white", fontSize: 11, fontWeight: "800" },
  endBtn: { marginLeft: "auto", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  endBtnText: { color: "white", fontSize: 12, fontWeight: "900" },
  titlePill: {
    position: "absolute", top: 92, left: 14,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12,
  },
  titlePillText: { color: "white", fontSize: 13, fontWeight: "900" },
  controlsRow: { position: "absolute", right: 14, bottom: 140, gap: 14, alignItems: "center" },
  controlBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
});
