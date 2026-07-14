import { hasSupabase } from "../../lib/config";
import type { Backend } from "./types";
import { MockBackend } from "./mock";
import { SupabaseBackend } from "./supabase";

let instance: Backend | null = null;

/**
 * Returns the active backend. Uses Supabase when credentials are configured,
 * otherwise a local mock so the app is runnable and testable out of the box.
 */
export function getBackend(): Backend {
  if (!instance) {
    instance = hasSupabase ? new SupabaseBackend() : new MockBackend();
  }
  return instance;
}

export const usingMockBackend = !hasSupabase;

export * from "./types";
