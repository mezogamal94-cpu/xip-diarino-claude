import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  LiveKitRoom,
  useTracks,
  useParticipants,
  VideoTrack,
  isTrackReference,
  AudioSession,
} from "@livekit/react-native";
import { Track } from "livekit-client";
import Svg, { Path } from "react-native-svg";
import { LiveCommentsOverlay } from "../../components/live/LiveCommentsOverlay";
import { useLiveKitToken, useLiveComments } from "../../lib/hooks/useLiveKitRoom";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { useLanguage } from "../../lib/hooks/useLanguage";

// NOTE: title/broadcaster name are passed as query params for now since
// there's no `lives` table in this repo yet to look them up by id — once
// that table exists, fetch by `id` here instead of trusting the caller's params.
export default function LiveViewerScreen() {
  const { id, title, sellerName } = useLocalSearchParams<{ id: string; title?: string; sellerName?: string }>();
  const { displayName } = useCurrentUser();
  const { t } = useLanguage();
  const { info, error, ready } = useLiveKitToken(id);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t("هذا البث غير متاح حاليًا")}</Text>
        <Pressable style={styles.leaveBtn} onPress={() => router.back()}>
          <Text style={styles.leaveBtnText}>{t("رجوع")}</Text>
        </Pressable>
      </View>
    );
  }

  if (!ready || !info) return <View style={styles.center} />;

  return (
    <LiveKitRoom serverUrl={info.url} token={info.token} connect video={false} audio={false}>
      <ViewerLiveView title={title ?? ""} sellerName={sellerName ?? t("البائع")} displayName={displayName} />
    </LiveKitRoom>
  );
}

function ViewerLiveView({ title, sellerName, displayName }: { title: string; sellerName: string; displayName: string }) {
  const { t } = useLanguage();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera]);
  const remoteTrackRef = tracks.find((t) => !t.participant.isLocal && isTrackReference(t));
  const { comments, sendComment } = useLiveComments(displayName);

  useEffect(() => {
    AudioSession.startAudioSession();
    return () => { AudioSession.stopAudioSession(); };
  }, []);

  return (
    <View style={styles.container}>
      {remoteTrackRef && isTrackReference(remoteTrackRef) ? (
        <VideoTrack trackRef={remoteTrackRef} style={styles.video} />
      ) : (
        <View style={[styles.video, styles.waitingBg]}>
          <Text style={styles.waitingText}>{t("في انتظار البث...")}</Text>
        </View>
      )}

      <View style={styles.topBar}>
        <View style={styles.broadcasterChip}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{sellerName.charAt(0)}</Text>
          </View>
          <Text style={styles.broadcasterName}>{t(sellerName)}</Text>
          <Pressable style={styles.followBtn}>
            <Text style={styles.followBtnText}>{t("متابعة")}</Text>
          </Pressable>
        </View>
        <View style={styles.viewerPill}>
          <Text style={styles.viewerPillText}>👁 {participants.length}</Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
            <Path d="M6 6l12 12M18 6L6 18" />
          </Svg>
        </Pressable>
      </View>

      {!!title && (
        <View style={styles.titlePill}>
          <Text style={styles.titlePillText}>📢 {t(title)}</Text>
        </View>
      )}

      <View style={styles.sideActions}>
        <Pressable style={styles.actionBtn}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            <Path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
          </Svg>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            <Path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v14" />
          </Svg>
        </Pressable>
      </View>

      <LiveCommentsOverlay comments={comments} onSend={sendComment} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center", gap: 16 },
  errorText: { color: "white", fontSize: 15, fontWeight: "800" },
  leaveBtn: { backgroundColor: "#22A652", borderRadius: 999, paddingVertical: 10, paddingHorizontal: 24 },
  leaveBtnText: { color: "white", fontWeight: "900" },
  video: { flex: 1 },
  waitingBg: { backgroundColor: "#111", alignItems: "center", justifyContent: "center" },
  waitingText: { color: "#9ca3af", fontSize: 14, fontWeight: "700" },
  topBar: { position: "absolute", top: 50, left: 14, right: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  broadcasterChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 6 },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#22A652", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "white", fontWeight: "900", fontSize: 12 },
  broadcasterName: { color: "white", fontSize: 12, fontWeight: "800" },
  followBtn: { backgroundColor: "#22A652", borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
  followBtnText: { color: "white", fontSize: 10, fontWeight: "900" },
  viewerPill: { marginLeft: "auto", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  viewerPillText: { color: "white", fontSize: 11, fontWeight: "800" },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  titlePill: { position: "absolute", top: 92, left: 14, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  titlePillText: { color: "white", fontSize: 13, fontWeight: "900" },
  sideActions: { position: "absolute", right: 12, bottom: 150, gap: 18, alignItems: "center" },
  actionBtn: { alignItems: "center", justifyContent: "center" },
});
