import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { SupabaseClient } from "@supabase/supabase-js";
import { uid } from "../../../lib/utils";

export const MEDIA_BUCKET = "media";

function base64ToUint8Array(base64: string): Uint8Array {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === "=") bufferLength--;
  if (base64[base64.length - 2] === "=") bufferLength--;
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const e1 = lookup[base64.charCodeAt(i)];
    const e2 = lookup[base64.charCodeAt(i + 1)];
    const e3 = lookup[base64.charCodeAt(i + 2)];
    const e4 = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (base64[i + 2] !== "=") bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (base64[i + 3] !== "=") bytes[p++] = ((e3 & 3) << 6) | (e4 & 63);
  }
  return bytes;
}

function extFromUri(uri: string): string {
  const match = /\.(\w+)(?:\?.*)?$/.exec(uri);
  return match ? match[1].toLowerCase() : "jpg";
}

/**
 * Uploads a local image (file:// on native, blob/data uri on web) to Supabase
 * storage and returns a public URL. Handles the RN/web difference in file
 * access.
 */
export async function uploadImage(
  supabase: SupabaseClient,
  userId: string,
  uri: string
): Promise<string> {
  // Already a remote url — nothing to upload (e.g. seeded/demo images).
  if (/^https?:\/\//.test(uri)) return uri;

  const ext = extFromUri(uri);
  const path = `${userId}/${uid("img")}.${ext}`;
  const contentType = ext === "png" ? "image/png" : "image/jpeg";

  let body: Uint8Array | Blob;
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    body = await res.blob();
  } else {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    body = base64ToUint8Array(base64);
  }

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, body, { contentType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
