import Constants from "expo-constants";

/**
 * Runtime configuration.
 *
 * Values are read from Expo public env vars (EXPO_PUBLIC_*) which are inlined at
 * build time and are safe for the client. When Supabase credentials are absent,
 * the app automatically falls back to a fully-featured local mock backend so it
 * remains runnable and testable out of the box.
 */

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  googleAuthClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const config = {
  supabaseUrl:
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? "",
  supabaseAnonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? "",
  googleAuthClientId:
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? extra.googleAuthClientId ?? "",
  // OpenStreetMap Nominatim is free and needs no API key. Override with a
  // self-hosted / commercial geocoder if desired.
  geocoderBaseUrl:
    process.env.EXPO_PUBLIC_GEOCODER_URL ?? "https://nominatim.openstreetmap.org",
};

/** True when a real Supabase backend is configured. */
export const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey);
