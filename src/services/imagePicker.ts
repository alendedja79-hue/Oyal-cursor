import * as ImagePicker from "expo-image-picker";

export interface PickedImage {
  uri: string;
  /** GPS coordinates read from the photo's EXIF metadata, when available. */
  latitude?: number;
  longitude?: number;
}

/**
 * Converts EXIF GPS fields (which may be strings, DMS arrays, or decimals)
 * into a decimal degree value. Applies the N/S/E/W reference.
 */
function normalizeCoord(value: unknown, ref?: unknown): number | undefined {
  if (value == null) return undefined;
  let dec: number | undefined;

  if (typeof value === "number") {
    dec = value;
  } else if (typeof value === "string") {
    const n = parseFloat(value);
    dec = Number.isNaN(n) ? undefined : n;
  } else if (Array.isArray(value) && value.length === 3) {
    const [d, m, s] = value.map(Number);
    dec = d + m / 60 + s / 3600;
  }
  if (dec == null) return undefined;

  const r = typeof ref === "string" ? ref.toUpperCase() : "";
  if ((r === "S" || r === "W") && dec > 0) dec = -dec;
  return dec;
}

function extractExifLocation(
  exif: Record<string, any> | null | undefined
): { latitude?: number; longitude?: number } {
  if (!exif) return {};
  const latitude = normalizeCoord(
    exif.GPSLatitude ?? exif.latitude,
    exif.GPSLatitudeRef
  );
  const longitude = normalizeCoord(
    exif.GPSLongitude ?? exif.longitude,
    exif.GPSLongitudeRef
  );
  return { latitude, longitude };
}

export async function requestPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === "granted";
}

/**
 * Opens the gallery to select multiple images. EXIF is requested so we can offer
 * the "use the location where the photo was taken" option.
 */
export async function pickImages(): Promise<PickedImage[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 0.8,
    exif: true,
  });
  if (result.canceled) return [];
  return result.assets.map((asset) => {
    const { latitude, longitude } = extractExifLocation(asset.exif);
    return { uri: asset.uri, latitude, longitude };
  });
}
