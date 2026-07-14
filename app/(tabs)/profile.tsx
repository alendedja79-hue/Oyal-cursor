import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../../src/components/Avatar";
import { Badge } from "../../src/components/Badge";
import { Button } from "../../src/components/Button";
import { Loading, EmptyState } from "../../src/components/States";
import { useAuth } from "../../src/context/AuthContext";
import { getBackend } from "../../src/services/backend";
import type {
  ProfileStats,
  TripWithDetails,
} from "../../src/services/backend/types";
import { colors, fontSize, radius, shadow, spacing } from "../../src/theme/theme";

export default function ProfilePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [s, t] = await Promise.all([
        getBackend().getProfile(user.id),
        getBackend().listTripsByUser(user.id),
      ]);
      setStats(s);
      setTrips(t);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !stats) return <Loading label="Loading profile…" />;

  const { profile, uniqueLocationCount, tripCount } = stats;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable style={styles.signOut} onPress={signOut} hitSlop={8}>
          <Ionicons name="log-out-outline" size={22} color={colors.textInverse} />
        </Pressable>
        <Avatar uri={profile.profile_photo} name={profile.username} size={96} />
        <Text style={styles.username}>{profile.username}</Text>
        <Text style={styles.email}>{profile.email}</Text>

        <View style={styles.statsRow}>
          <Stat value={uniqueLocationCount} label="Unique places" />
          <View style={styles.statDivider} />
          <Stat value={tripCount} label="Trips shared" />
        </View>
      </View>

      <View style={styles.body}>
        <Button
          label="Edit profile"
          icon="create-outline"
          variant="outline"
          onPress={() => router.push("/settings")}
        />

        <InfoCard
          icon="heart"
          title="Favourite place visited"
          value={profile.favorite_place}
          empty="Add your favourite place in settings"
        />
        <InfoCard
          icon="bulb"
          title="Top travel tip"
          value={profile.travel_tip}
          empty="Share your best travel tip in settings"
        />

        <Text style={styles.sectionTitle}>My trips</Text>
        {trips.length === 0 ? (
          <EmptyState
            icon="camera-outline"
            title="No trips yet"
            subtitle="Share your first adventure!"
          />
        ) : (
          <View style={styles.grid}>
            {trips.map((trip) => (
              <Pressable
                key={trip.id}
                style={styles.tile}
                onPress={() => router.push(`/trip/${trip.id}`)}
              >
                <Image
                  source={{ uri: trip.coverImage ?? undefined }}
                  style={styles.tileImage}
                  contentFit="cover"
                  transition={200}
                />
                <Badge
                  label={trip.uniqueLocationCount}
                  icon="location"
                  style={styles.tileBadge}
                />
                <Text style={styles.tileName} numberOfLines={1}>
                  {trip.trip_name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoCard({
  icon,
  title,
  value,
  empty,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string | null;
  empty: string;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={[styles.infoValue, !value && styles.infoEmpty]}>
          {value || empty}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    alignItems: "center",
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    gap: spacing.xs,
  },
  signOut: {
    position: "absolute",
    right: spacing.lg,
    top: spacing.xxl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.textInverse,
    marginTop: spacing.sm,
  },
  email: { fontSize: fontSize.sm, color: "rgba(255,255,255,0.85)" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    gap: spacing.xl,
  },
  stat: { alignItems: "center" },
  statValue: { fontSize: fontSize.xxl, fontWeight: "900", color: colors.textInverse },
  statLabel: { fontSize: fontSize.xs, color: "rgba(255,255,255,0.9)" },
  statDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.3)" },
  body: { padding: spacing.lg, gap: spacing.md },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: "600" },
  infoValue: { fontSize: fontSize.md, color: colors.text, fontWeight: "600", marginTop: 2 },
  infoEmpty: { fontStyle: "italic", fontWeight: "400", color: colors.textMuted },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.sm,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.soft,
  },
  tileImage: { width: "100%", height: 120, backgroundColor: colors.surfaceMuted },
  tileBadge: { position: "absolute", top: spacing.sm, left: spacing.sm },
  tileName: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
    padding: spacing.sm,
  },
});
