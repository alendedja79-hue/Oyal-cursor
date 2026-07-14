import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { TextField } from "../../src/components/TextField";
import { Select } from "../../src/components/Select";
import { Button } from "../../src/components/Button";
import {
  LocationTagInput,
  LocationValue,
} from "../../src/components/LocationTagInput";
import { useAuth } from "../../src/context/AuthContext";
import { getBackend } from "../../src/services/backend";
import { pickImages, requestPermission } from "../../src/services/imagePicker";
import {
  PARTY_SIZES,
  SEASONS,
  type PartySize,
  type Season,
} from "../../src/services/backend/types";
import { colors, fontSize, radius, shadow, spacing } from "../../src/theme/theme";

interface PhotoDraft {
  key: string;
  uri: string;
  exif?: { latitude?: number; longitude?: number };
  location: LocationValue;
}

export default function ShareTripPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [tripName, setTripName] = useState("");
  const [season, setSeason] = useState<Season | null>(null);
  const [spend, setSpend] = useState("");
  const [partySize, setPartySize] = useState<PartySize | null>(null);
  const [itinerary, setItinerary] = useState("");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAddPhotos() {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo access to add trip images."
      );
      return;
    }
    const picked = await pickImages();
    if (picked.length === 0) return;
    setPhotos((prev) => [
      ...prev,
      ...picked.map((p, i) => ({
        key: `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        uri: p.uri,
        exif:
          p.latitude != null && p.longitude != null
            ? { latitude: p.latitude, longitude: p.longitude }
            : undefined,
        location: { location_name: "" } as LocationValue,
      })),
    ]);
  }

  function updatePhotoLocation(key: string, location: LocationValue) {
    setPhotos((prev) =>
      prev.map((p) => (p.key === key ? { ...p, location } : p))
    );
  }

  function removePhoto(key: string) {
    setPhotos((prev) => prev.filter((p) => p.key !== key));
  }

  function validate(): string | null {
    if (!tripName.trim()) return "Give your trip a name.";
    if (!season) return "Select a season.";
    if (!partySize) return "Select a party size.";
    if (spend.trim() && Number.isNaN(Number(spend)))
      return "Spend must be a number.";
    if (photos.length === 0) return "Add at least one photo.";
    const missing = photos.find((p) => !p.location.location_name.trim());
    if (missing) return "Each photo needs a tagged location.";
    return null;
  }

  async function onSubmit() {
    setError(null);
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    if (!user) return;
    try {
      setSubmitting(true);
      await getBackend().createTrip(user.id, {
        trip_name: tripName.trim(),
        season: season!,
        spend: Number(spend) || 0,
        party_size: partySize!,
        itinerary: itinerary.trim(),
        photos: photos.map((p) => ({
          uri: p.uri,
          location_name: p.location.location_name,
          latitude: p.location.latitude,
          longitude: p.location.longitude,
          country: p.location.country,
        })),
      });
      // Reset form
      setTripName("");
      setSeason(null);
      setSpend("");
      setPartySize(null);
      setItinerary("");
      setPhotos([]);
      Alert.alert("Trip shared!", "Your adventure is now live in Discovery.", [
        { text: "View Discovery", onPress: () => router.push("/(tabs)/discovery") },
        { text: "OK" },
      ]);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader title="Share your trip" subtitle="Inspire the community" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="Trip name"
          icon="airplane-outline"
          placeholder="e.g. Slow mornings in Japan"
          value={tripName}
          onChangeText={setTripName}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Select
              label="Season"
              icon="leaf-outline"
              value={season}
              options={SEASONS}
              onChange={setSeason}
            />
          </View>
          <View style={styles.half}>
            <Select
              label="Party size"
              icon="people-outline"
              value={partySize}
              options={PARTY_SIZES}
              onChange={setPartySize}
            />
          </View>
        </View>

        <TextField
          label="Overall spend (£)"
          icon="wallet-outline"
          placeholder="e.g. 1200"
          keyboardType="numeric"
          value={spend}
          onChangeText={setSpend}
        />

        <TextField
          label="Trip itinerary"
          placeholder="Day 1… Day 2… what did you do?"
          multiline
          value={itinerary}
          onChangeText={setItinerary}
        />

        {/* Photos */}
        <View style={styles.photosHeader}>
          <Text style={styles.sectionLabel}>Trip photos</Text>
          <Text style={styles.sectionHint}>
            Tag where each photo was taken
          </Text>
        </View>

        {photos.map((photo, index) => (
          <View key={photo.key} style={styles.photoCard}>
            <View style={styles.photoTop}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.thumb}
                contentFit="cover"
              />
              <View style={styles.photoMeta}>
                <Text style={styles.photoIndex}>Photo {index + 1}</Text>
                {photo.exif ? (
                  <View style={styles.exifTag}>
                    <Ionicons name="navigate" size={12} color={colors.success} />
                    <Text style={styles.exifTagText}>GPS found in photo</Text>
                  </View>
                ) : (
                  <Text style={styles.noExif}>No GPS in photo — tag manually</Text>
                )}
              </View>
              <Pressable onPress={() => removePhoto(photo.key)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
            <LocationTagInput
              value={photo.location}
              exif={photo.exif}
              onChange={(loc) => updatePhotoLocation(photo.key, loc)}
            />
          </View>
        ))}

        <Pressable style={styles.addPhotos} onPress={onAddPhotos}>
          <Ionicons name="images-outline" size={22} color={colors.primary} />
          <Text style={styles.addPhotosText}>
            {photos.length ? "Add more photos" : "Upload photos"}
          </Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Share trip"
          icon="paper-plane"
          onPress={onSubmit}
          loading={submitting}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  row: { flexDirection: "row", gap: spacing.md },
  half: { flex: 1 },
  photosHeader: { gap: 2 },
  sectionLabel: { fontSize: fontSize.md, fontWeight: "800", color: colors.text },
  sectionHint: { fontSize: fontSize.xs, color: colors.textMuted },
  photoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.soft,
  },
  photoTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  photoMeta: { flex: 1, gap: 2 },
  photoIndex: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  exifTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  exifTagText: { fontSize: fontSize.xs, color: colors.success, fontWeight: "600" },
  noExif: { fontSize: fontSize.xs, color: colors.textMuted },
  addPhotos: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primaryLight,
    backgroundColor: colors.surfaceMuted,
  },
  addPhotosText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.md },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
