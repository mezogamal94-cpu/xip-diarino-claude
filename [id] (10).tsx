import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, Animated, Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Rect, Circle } from "react-native-svg";
import { supabase } from "../lib/supabase";
import { signInWithGoogle } from "../lib/hooks/useAuth";

const SKIP_KEY = "diarino:skip_auth"; // ↔ SKIP_KEY/sessionStorage in the original — AsyncStorage on native

export default function AuthGateScreen() {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(SKIP_KEY).then((v) => {
      if (mounted && v === "1") setSkipped(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setHasSession(true);
        setSkipped(false);
        AsyncStorage.removeItem(SKIP_KEY);
      } else {
        setHasSession(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasSession(!!data.session?.user);
      setLoading(false);
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  // ↔ the `if (!session && !skipped) return <LoginScreen/>` branch — once
  // either is true, hand off to the tab shell instead of an iframe src swap.
  useEffect(() => {
    if (!loading && (hasSession || skipped)) {
      router.replace("/(tabs)");
    }
  }, [loading, hasSession, skipped]);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    setError(null);
    const { error: err } = await signInWithGoogle();
    setSigningIn(false);
    if (err) setError(err);
  }

  async function handleSkip() {
    await AsyncStorage.setItem(SKIP_KEY, "1");
    setSkipped(true);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#22A652" size="large" />
      </View>
    );
  }

  if (hasSession || skipped) {
    return <View style={styles.loadingContainer} />; // brief flash before the replace() above lands
  }

  return (
    <LoginScreen onGoogle={handleGoogleSignIn} onSkip={handleSkip} signingIn={signingIn} error={error} />
  );
}

function LoginScreen({
  onGoogle, onSkip, signingIn, error,
}: { onGoogle: () => void; onSkip: () => void; signingIn: boolean; error: string | null }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // ↔ the fade-in logo animation + pulsing green glow from the web splash screen
    Animated.timing(logoOpacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.15, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <NightSkyline />

      <View style={styles.centerBlock}>
        <Animated.View style={[styles.glow, { transform: [{ scale: glowScale }] }]} />
        <Animated.View style={{ opacity: logoOpacity, alignItems: "center" }}>
          <Text style={styles.logoText}>Diarino</Text>
          <Text style={styles.logoSubtext}>ديار توك — منصة العقارات على شكل ريلز</Text>
        </Animated.View>
      </View>

      <View style={styles.bottomBlock}>
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable style={styles.googleBtn} onPress={onGoogle} disabled={signingIn}>
          {signingIn ? (
            <ActivityIndicator color="#111" size="small" />
          ) : (
            <>
              <GoogleIcon />
              <Text style={styles.googleBtnText}>المتابعة باستخدام جوجل</Text>
            </>
          )}
        </Pressable>

        <Pressable style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipBtnText}>المتابعة كضيف</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Simplified night-city skyline — a handful of rects with a few lit windows,
// standing in for the original's more elaborate twinkling-window SVG.
function NightSkyline() {
  const buildings = [
    { x: 0, w: 40, h: 120 }, { x: 42, w: 30, h: 180 }, { x: 74, w: 45, h: 90 },
    { x: 121, w: 35, h: 150 }, { x: 158, w: 50, h: 200 }, { x: 210, w: 30, h: 100 },
    { x: 242, w: 40, h: 160 }, { x: 284, w: 35, h: 110 }, { x: 321, w: 55, h: 190 },
  ];
  return (
    <Svg width="100%" height={220} viewBox="0 0 376 220" style={styles.skyline} preserveAspectRatio="none">
      {buildings.map((b, i) => (
        <Rect key={i} x={b.x} y={220 - b.h} width={b.w} height={b.h} fill="#0f2419" />
      ))}
      {buildings.flatMap((b, i) =>
        Array.from({ length: Math.floor(b.h / 22) }).map((_, j) => (
          <Circle
            key={`${i}-${j}`}
            cx={b.x + 8 + (j % 3) * 10}
            cy={220 - b.h + 14 + j * 22}
            r={1.6}
            fill={(i + j) % 3 === 0 ? "#22A652" : "#FDE68A"}
            opacity={0.7}
          />
        ))
      )}
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Rect width={24} height={24} rx={4} fill="white" />
      <Circle cx={12} cy={12} r={9} fill="none" stroke="#4285F4" strokeWidth={0} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: "#0b1512", alignItems: "center", justifyContent: "center" },
  container: { flex: 1, backgroundColor: "#0b1512", justifyContent: "space-between" },
  skyline: { position: "absolute", bottom: 200, left: 0, right: 0 },
  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center" },
  glow: {
    position: "absolute", width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(34,166,82,0.25)",
  },
  logoText: { color: "white", fontSize: 34, fontWeight: "900", letterSpacing: 1 },
  logoSubtext: { color: "rgba(255,255,255,0.7)", fontSize: 12.5, marginTop: 8, textAlign: "center" },
  bottomBlock: { padding: 24, paddingBottom: 42, gap: 12 },
  errorText: { color: "#f87171", fontSize: 12, textAlign: "center", marginBottom: 4 },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "white", borderRadius: 14, paddingVertical: 15,
  },
  googleBtnText: { color: "#111", fontSize: 14, fontWeight: "800" },
  skipBtn: { alignItems: "center", paddingVertical: 10 },
  skipBtnText: { color: "rgba(255,255,255,0.65)", fontSize: 12.5, fontWeight: "700" },
});
