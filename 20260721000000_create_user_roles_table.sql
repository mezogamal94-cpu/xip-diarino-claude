import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";

const SKIP_KEY = "diarino:skip_auth"; // must match app/index.tsx

WebBrowser.maybeCompleteAuthSession();

// ↔ translateOAuthError() — same error-message mapping, ported as-is.
export function translateOAuthError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("popup") && m.includes("closed")) return "تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.";
  if (m.includes("popup") && m.includes("block")) return "المتصفح منع النافذة المنبثقة. فعّل النوافذ لهذا الموقع وحاول مجدداً.";
  if (m.includes("unsupported provider") || m.includes("provider is not enabled"))
    return "مزوّد Google غير مفعّل في الخلفية. راجع إعدادات OAuth.";
  if (m.includes("redirect") && (m.includes("uri") || m.includes("mismatch")))
    return "عنوان إعادة التوجيه غير مطابق للمُسجَّل في Google Cloud.";
  if (m.includes("invalid_client") || m.includes("client_id"))
    return "بيانات اعتماد Google غير صحيحة (Client ID/Secret). حدّثها من صفحة الإعدادات.";
  if (m.includes("access_denied") || m.includes("denied")) return "تم رفض الإذن من قِبل المستخدم أو من قِبل Google.";
  if (m.includes("network") || m.includes("fetch")) return "تعذر الاتصال بالخادم. تحقق من الإنترنت.";
  if (m.includes("timeout") || m.includes("timed out")) return "انتهت مهلة الاتصال. حاول مرة أخرى.";
  if (m.includes("expired")) return "انقضت صلاحية الجلسة/الرمز. أعد المحاولة.";
  return raw || "تعذر تسجيل الدخول. حاول مرة أخرى.";
}

// ↔ signInGoogle() — the web version used @lovable.dev/cloud-auth-js's
// signInWithOAuth (window.location redirect, browser-only). Native
// equivalent: Supabase's own signInWithOAuth to get the provider URL, open
// it in an in-app browser tab (expo-web-browser), then extract the tokens
// from the redirect and hand them to supabase.auth.setSession() — this is
// the currently-documented pattern for Supabase + Expo (no extra native
// Google SDK/module needed, works in a dev client build).
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "diarino", path: "auth-callback" });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return { error: translateOAuthError(error?.message || "") };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
  if (result.type !== "success" || !result.url) {
    // User closed the browser tab, or it timed out — not necessarily an
    // "error" worth alarming over, but the caller still needs to know
    // sign-in didn't complete.
    return { error: result.type === "cancel" ? null : "تعذر تسجيل الدخول. حاول مرة أخرى." };
  }

  const url = new URL(result.url);
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  const access_token = url.searchParams.get("access_token") || hashParams.get("access_token");
  const refresh_token = url.searchParams.get("refresh_token") || hashParams.get("refresh_token");

  if (!access_token || !refresh_token) {
    const errDesc = url.searchParams.get("error_description") || hashParams.get("error_description");
    return { error: translateOAuthError(errDesc || "") };
  }

  const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
  if (sessionError) return { error: translateOAuthError(sessionError.message) };

  return { error: null };
}

// ↔ fullSignOut() — also clears the guest-skip flag, otherwise logging out
// while previously in guest mode would just bounce straight back into the
// tabs via the skip check in app/index.tsx instead of showing the login screen.
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
  }
  await AsyncStorage.removeItem(SKIP_KEY).catch(() => {});
}
