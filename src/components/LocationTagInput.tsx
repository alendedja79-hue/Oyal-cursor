import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, fontSize, shadow } from "../theme/theme";
import {
  PlaceSuggestion,
  reverseGeocode,
  searchPlaces,
  countryFromLocationName,
} from "../services/location";

export interface LocationValue {
  location_name: string;
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
}

interface Props {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  /** EXIF coordinates from the photo's gallery metadata, if any. */
  exif?: { latitude?: number; longitude?: number };
}

/**
 * Location tag field with type-ahead autocomplete (OpenStreetMap) plus an
 * option to use the photo's embedded gallery location when available.
 */
export function LocationTagInput({ value, onChange, exif }: Props) {
  const [query, setQuery] = useState(value.location_name);
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [usingExif, setUsingExif] = useState(false);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasExif =
    exif?.latitude != null &&
    exif?.longitude != null &&
    Number.isFinite(exif.latitude) &&
    Number.isFinite(exif.longitude);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!open) return;
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      const res = await searchPlaces(query);
      setResults(res);
      setSearching(false);
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, open]);

  function select(place: PlaceSuggestion) {
    setQuery(place.name);
    setOpen(false);
    setResults([]);
    onChange({
      location_name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      country: place.country ?? countryFromLocationName(place.name),
    });
  }

  async function useGalleryLocation() {
    if (!hasExif) return;
    setUsingExif(true);
    const place = await reverseGeocode(exif!.latitude!, exif!.longitude!);
    setUsingExif(false);
    if (place) {
      select(place);
    } else {
      // Fall back to raw coordinates if reverse geocoding is unavailable.
      const name = `${exif!.latitude!.toFixed(4)}, ${exif!.longitude!.toFixed(4)}`;
      setQuery(name);
      onChange({
        location_name: name,
        latitude: exif!.latitude,
        longitude: exif!.longitude,
        country: null,
      });
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <Ionicons name="location-outline" size={18} color={colors.primary} />
        <TextInput
          style={styles.input}
          placeholder="Tag a location…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onFocus={() => setOpen(true)}
          onChangeText={(t) => {
            setQuery(t);
            setOpen(true);
            onChange({ ...value, location_name: t });
          }}
        />
        {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        {value.latitude != null && !searching ? (
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        ) : null}
      </View>

      {hasExif ? (
        <Pressable style={styles.exifBtn} onPress={useGalleryLocation}>
          {usingExif ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="image-outline" size={16} color={colors.primary} />
          )}
          <Text style={styles.exifText}>
            Use photo's gallery location (from when it was taken)
          </Text>
        </Pressable>
      ) : null}

      {open && results.length > 0 ? (
        <View style={styles.dropdown}>
          {results.map((r) => (
            <Pressable
              key={r.id}
              style={styles.result}
              onPress={() => select(r)}
            >
              <Ionicons name="location" size={16} color={colors.textMuted} />
              <Text style={styles.resultText} numberOfLines={2}>
                {r.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  exifBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  exifText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: "600" },
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.soft,
  },
  result: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  resultText: { flex: 1, fontSize: fontSize.sm, color: colors.text },
});
