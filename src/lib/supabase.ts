import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { config, hasSupabase } from "./config";

/**
 * Lazily created Supabase client. Only instantiated when credentials exist so
 * the local mock backend can run without any configuration.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!hasSupabase) {
    throw new Error("Supabase is not configured.");
  }
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // URL detection only makes sense on web where OAuth redirects back.
        detectSessionInUrl: Platform.OS === "web",
      },
    });
  }
  return client;
}
