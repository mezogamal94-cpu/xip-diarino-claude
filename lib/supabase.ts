import "react-native-url-polyfill/auto"; // supabase-js needs URL/URLSearchParams polyfills on native
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// ↔ src/integrations/supabase/client.ts, adapted for native:
//  - localStorage → AsyncStorage (localStorage doesn't exist on native)
//  - import.meta.env (Vite) → process.env.EXPO_PUBLIC_* (Expo's env convention;
//    only vars prefixed EXPO_PUBLIC_ get inlined into the native bundle)
//  - dropped the custom fetch/Proxy lazy-init wrapper from the web client;
//    not needed here since Expo env vars are available at import time
//
// TODO: port src/integrations/supabase/types.ts (generated `Database` type)
// over for full query type-safety — left untyped for now to keep this pass scoped.

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY — set them in your .env / app config."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // no browser URL to parse OAuth redirects from on native
  },
});
