// ↔ MUSIC_TRACKS in app-viewer.html. On web these were generated at
// runtime with the WebAudio API (oscillator + gain envelope per note) —
// there's no native equivalent to WebAudio's AudioContext without pulling
// in an extra native module, and these are a small FIXED set of 5 tracks,
// so instead of shipping a soft-synth we pre-rendered each one exactly
// once (same note frequencies, tempo, waveform, and attack/decay envelope
// as startReelMusic()) into a real looping WAV bundled as an asset. Same
// sound, zero runtime synthesis cost, works with plain expo-av.
//
// Keys match property.music strings exactly (that's what the mock data /
// publish flow already stores), so lookups need no renaming elsewhere.
export const MUSIC_TRACK_ASSETS: Record<string, number> = {
  "Uplifting Corporate": require("../assets/music/uplifting-corporate.wav"),
  "Chill Lounge": require("../assets/music/chill-lounge.wav"),
  "Acoustic Morning": require("../assets/music/acoustic-morning.wav"),
  "Oriental Vibes": require("../assets/music/oriental-vibes.wav"),
  "Modern Beat": require("../assets/music/modern-beat.wav"),
};

export function getMusicAsset(trackName: string | null | undefined): number | null {
  if (!trackName) return null;
  return MUSIC_TRACK_ASSETS[trackName] ?? MUSIC_TRACK_ASSETS["Uplifting Corporate"];
}
