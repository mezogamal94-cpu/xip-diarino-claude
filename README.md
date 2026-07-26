# Diarino (ديار توك) — React Native / Expo

Migrated from the original vanilla-JS single-page app (`app-viewer.html`) to
Expo Router + TypeScript + Supabase + LiveKit.

## 1. Install

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
```

This project uses native modules (LiveKit, react-native-maps, camera) that
**do not work in Expo Go**. You must build a Dev Client:

```bash
npx expo prebuild
npx expo run:android   # or: npx expo run:ios
```

## 2. Supabase setup

Run every migration in `supabase/migrations/` in order (they're timestamped,
so `supabase db push` applies them correctly as long as none are skipped):

```bash
supabase db push
```

Then deploy the Edge Functions:

```bash
supabase functions deploy livekit-token
supabase functions deploy livekit-recording
supabase functions deploy livekit-webhook --no-verify-jwt
```

### Required secrets (`supabase secrets set KEY=value`)

| Secret | Used by |
|---|---|
| `LIVEKIT_URL` | livekit-token, livekit-recording, livekit-webhook |
| `LIVEKIT_API_KEY` | same three |
| `LIVEKIT_API_SECRET` | same three |
| `SUPABASE_SERVICE_ROLE_KEY` | livekit-webhook only (bypasses RLS to close abandoned rooms / update recording status) |
| `RECORDING_S3_ACCESS_KEY` | livekit-recording, livekit-webhook |
| `RECORDING_S3_SECRET` | livekit-recording |
| `RECORDING_S3_ENDPOINT` | livekit-recording |
| `RECORDING_S3_BUCKET` | livekit-recording, livekit-webhook |
| `RECORDING_S3_REGION` | livekit-recording (defaults to us-east-1 if unset) |

`RECORDING_S3_*` values come from **Supabase Dashboard → Storage → S3
Connection**, after creating a bucket named `live-recordings` there.

### Required manual step: LiveKit webhook

In the LiveKit Cloud dashboard → Settings → Webhooks, add:
```
https://<your-project-ref>.supabase.co/functions/v1/livekit-webhook
```

### Required manual step: OAuth redirect

In Supabase Dashboard → Authentication → URL Configuration → Redirect URLs, add:
```
diarino://auth-callback
```

### Required manual step: granting yourself admin access

There is no in-app way to become an admin (by design — see the RLS policy
comment in `20260721000000_create_user_roles_table.sql`). After signing up
once, insert a row manually via the Supabase SQL editor:

```sql
insert into public.user_roles (user_id, role) values ('<your-user-uuid>', 'admin');
```

### Android Maps API key

`app.json`'s `android.config.googleMaps.apiKey` has a placeholder —
replace it with a real Google Maps API key before building for Android, or
the map in the geo-search screen won't render.

## 3. Storage buckets

Three buckets are created by migrations (`chat-images`, `property-media`,
`avatars`), all public-read with folder-based ownership RLS
(`<uploader_user_id>/...`). A fourth, `live-recordings`, must be created
**manually** in the dashboard (see the S3 Connection step above) since
Egress writes to it via the S3-compatible API, not through a migration.

## 4. What's real vs. what's still local-only

Everything below now reads/writes real Supabase tables: properties,
requests, chats/messages (with Realtime), favorites, profiles, live rooms +
recordings, admin moderation state.

Still local-device-only (flagged in code comments at each spot):
- `savedLives`' pin/publish/comments-toggle metadata (`lib/hooks/useMyContent.ts`)
  — the recording itself is real (Supabase Storage + the `lives` table's
  recording columns), just the extra UI-management flags aren't synced.
- The admin dashboard's mock data (`lib/hooks/useAdminDB.ts`) — same mock
  dataset the original web admin panel used, persisted via AsyncStorage
  rather than wired to real aggregate queries over the tables above.

## 5. Known deferred items

- Full RTL layout mirroring on language toggle requires an app restart
  (`lib/hooks/useLanguage.ts` handles this via `expo-updates`, but only
  works in a Dev Client / production build, not plain Expo Go).
- Ad edit/pin has a 24h window (`canEditAd`); there's no UI for extending it.
- No push notifications — the in-app notification system
  (`lib/hooks/useNotifications.ts`) is mock data, not tied to real events.
- No automated tests.

## Project structure

```
app/                     Expo Router routes (file-based)
  _layout.tsx             Root layout — providers, LiveKit globals, RTL startup
  index.tsx               Auth gate / login screen
  (tabs)/                 Bottom tab group: reels, search, menu, requests, account
  property/[id].tsx       Property details
  seller/[id].tsx         Seller profile
  chat/                   Chat list + conversation
  live/                   Broadcast, viewer, replay
  publish/                Create-listing, create-request forms
  admin/                  Admin dashboard (gated by useIsAdmin)
components/               Organized by feature (reel/, live/, chat implied via app/, account/, admin/, shared/, publish/, search/, requests/, notifications/)
lib/
  hooks/                  All data hooks (React Query-backed where real, useSyncExternalStore for the remaining local stores)
  supabase.ts             Native Supabase client (AsyncStorage session storage)
  livekit.ts              LiveKit token/recording client calls
  geo.ts                  Haversine distance helper
  types.ts                Property/Seller/MediaItem types
data/                     Static reference data (locations, demo properties, i18n dictionary, mock notifications/chats/admin seed)
supabase/
  migrations/             All SQL, timestamped, apply in order
  functions/               livekit-token, livekit-recording, livekit-webhook
assets/music/             5 synthesized background-music tracks (WAV)
```
