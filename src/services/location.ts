import { config } from "../lib/config";

/**
 * Location tagging service backed by OpenStreetMap Nominatim (free, no key).
 *
 * Provides:
 *  - `searchPlaces`  → type-ahead autocomplete for the location tag field
 *  - `reverseGeocode` → turn EXIF GPS coordinates from a phone photo into a
 *    human readable place name (the "use the photo's gallery location" option)
 */

export interface PlaceSuggestion {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
}

const HEADERS = {
  // Nominatim asks for an identifying header.
  "User-Agent": "Oyal-Travel-App/1.0 (https://oyal.app)",
  "Accept-Language": "en",
};

function toSuggestion(item: any): PlaceSuggestion {
  const address = item.address ?? {};
  return {
    id: String(item.place_id ?? `${item.lat},${item.lon}`),
    name: item.display_name as string,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    country: (address.country as string) ?? null,
  };
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const url =
      `${config.geocoderBaseUrl}/search?format=jsonv2&addressdetails=1&limit=6&q=` +
      encodeURIComponent(q);
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const data = (await res.json()) as any[];
    return data.map(toSuggestion);
  } catch {
    return [];
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<PlaceSuggestion | null> {
  try {
    const url =
      `${config.geocoderBaseUrl}/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.error) return null;
    return toSuggestion(data);
  } catch {
    return null;
  }
}

/**
 * Best-effort country extraction from a free-form location name. Nominatim
 * display names end with the country, e.g. "Eiffel Tower, Paris, ..., France".
 */
export function countryFromLocationName(name: string): string | null {
  if (!name) return null;
  const parts = name.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
}
