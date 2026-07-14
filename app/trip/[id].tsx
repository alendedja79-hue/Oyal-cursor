import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../../src/components/Avatar";
import { Badge } from "../../src/components/Badge";
import { ImageCarousel } from "../../src/components/ImageCarousel";
import { Loading, EmptyState } from "../../src/components/States";
import { getBackend } from "../../src/services/backend";
import type { TripWithDetails } from "../../src/services/backend/types";
import { formatCurrency, timeAgo } from "../../src/lib/utils";
import { colors, fontSize, radius, spacing } from "../../src/theme/theme";

const { width } = Dimensions.get("window");

export default function TripDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getBackend()
      .getTrip(String(id))
      .then((t) => mounted && setTrip(t))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <Loading label="Loading trip…" />;
  if (!trip)
    return (
      <View style={styles.notFound}>
        <EmptyState icon="alert-circle-outline" title="Trip not found" />
        <Pressable onPress={() => router.back()} style={styles.closeText}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );

  const facts: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
    { icon: "leaf-outline", label: "Season", value: trip.season },
    { icon: "people-outline", label: "Party", value: trip.party_size },
    { icon: "wallet-outline", label: "Spend", value: formatCurrency(trip.spend) },
    {
      icon: "location-outline",
      label: "Locations",
      value: String(trip.uniqueLocationCount),
    },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <ImageCarousel photos={trip.photos} width={width} height={320} />
          <Pressable
            style={[styles.close, { top: insets.top + spacing.sm }]}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{trip.trip_name}</Text>

          <View style={styles.authorRow}>
            <Avatar
              uri={trip.author.profile_photo}
              name={trip.author.username}
              size={36}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>{trip.author.username}</Text>
              <Text style={styles.timestamp}>
                Shared {timeAgo(trip.created_at)}
              </Text>
            </View>
          </View>

          {/* Quick facts */}
          <View style={styles.facts}>
            {facts.map((f) => (
              <View key={f.label} style={styles.fact}>
                <Ionicons name={f.icon} size={18} color={colors.primary} />
                <Text style={styles.factValue}>{f.value}</Text>
                <Text style={styles.factLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          {trip.countries.length > 0 ? (
            <View style={styles.countries}>
              {trip.countries.map((c) => (
                <Badge key={c} label={c} icon="flag" color={colors.accent} />
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Itinerary</Text>
          <Text style={styles.itinerary}>{trip.itinerary}</Text>

          <Text style={styles.sectionTitle}>Tagged stops</Text>
          <View style={styles.stops}>
            {trip.photos.map((p) => (
              <View key={p.id} style={styles.stop}>
                <Ionicons name="location" size={15} color={colors.primary} />
                <Text style={styles.stopText} numberOfLines={1}>
                  {p.location_name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  notFound: { flex: 1, backgroundColor: colors.background },
  close: {
    position: "absolute",
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { alignItems: "center" },
  link: { color: colors.primary, fontWeight: "700" },
  body: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: "800", color: colors.text },
  authorRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  authorName: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  timestamp: { fontSize: fontSize.xs, color: colors.textMuted },
  facts: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  fact: { alignItems: "center", gap: 2, flex: 1 },
  factValue: { fontSize: fontSize.sm, fontWeight: "800", color: colors.text },
  factLabel: { fontSize: 10, color: colors.textMuted, textTransform: "uppercase" },
  countries: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.sm,
  },
  itinerary: { fontSize: fontSize.sm, color: colors.text, lineHeight: 22 },
  stops: { gap: spacing.xs },
  stop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  stopText: { flex: 1, fontSize: fontSize.sm, color: colors.text },
});
