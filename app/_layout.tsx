import { useState, useCallback, useEffect } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registerGlobals } from "@livekit/react-native";
import { applyPersistedRTLAtStartup } from "../lib/hooks/useLanguage";

// Required once, app-wide, before any LiveKit room is joined — sets up the
// native WebRTC bindings LiveKit needs. This only works in an Expo Dev
// Client / custom native build, NOT in Expo Go (no native WebRTC module
// there). Run `npx expo prebuild` + a dev client build once this lands.
registerGlobals();

// Keep the native splash screen visible while we set things up.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op if already hidden */
});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  // Equivalent of `const [queryClient] = useState(() => new QueryClient())`
  // from src/router.tsx — created once, stable across re-renders.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false, // no window focus concept on native
          },
        },
      })
  );

  useEffect(() => {
    // Applies the persisted language's RTL/LTR direction before first
    // paint (splash stays up until this resolves) — if a reload is needed
    // (I18nManager's flag doesn't match the persisted language yet, e.g.
    // right after toggleLanguage() flipped it), this itself triggers one
    // more reload so every subsequent screen already renders correctly
    // instead of janking mid-session.
    applyPersistedRTLAtStartup().finally(() => {
      // Placeholder for: font loading, Supabase getSession() bootstrap,
      // any other one-time async setup before we show UI.
      setIsReady(true);
    });
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          {/*
            Stack ↔ your TanStack <Outlet />.
            headerShown: false because Diarino's screens (reels/live/etc.)
            draw their own custom headers/overlays, same as the web app.
            Individual routes/groups can override this per-screen.
          */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            {/* The 5-tab shell (reels/search/menu/requests/account) —
                everything inside app-viewer.html's <body> once a session exists. */}
            <Stack.Screen name="(tabs)" />
            {/* Broadcaster (live/broadcast) + viewer (live/[id]) — real
                multi-viewer streaming via LiveKit, replacing renderLiveReel/
                renderMiniLive's getUserMedia-only local preview. */}
            <Stack.Screen name="live" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="property/[id]" options={{ presentation: "modal" }} />
            <Stack.Screen name="seller/[id]" options={{ presentation: "modal" }} />
            <Stack.Screen name="chat" options={{ presentation: "modal" }} />
            <Stack.Screen name="publish" options={{ presentation: "modal" }} />
            <Stack.Screen name="coming-soon" options={{ presentation: "modal" }} />
            <Stack.Screen name="admin" />
            <Stack.Screen
              name="+not-found"
              options={{ headerShown: true, title: "Not Found" }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
