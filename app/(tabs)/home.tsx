import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image, ImageBackground } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Logo } from "../../src/components/Logo";
import { Avatar } from "../../src/components/Avatar";
import { Badge } from "../../src/components/Badge";
import { LinearGradientLike } from "../../src/components/Gradient";
import { useAuth } from "../../src/context/AuthContext";
import { getBackend } from "../../src/services/backend";
import type { TripWithDetails } from "../../src/services/backend/types";
import { shuffle } from "../../src/lib/utils";
import { colors, fontSize, radius, shadow, spacing } from "../../src/theme/theme";
import { branding, randomBackground } from "../../src/theme/theme";

const heroBg = randomBackground();

const QUICK_LINKS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}[] = [
  { label: "Share Trip", icon: "camera", route: "/(tabs)/share", color: colors.primary },
  { label: "Discovery", icon: "compass", route: "/(tabs)/discovery", color: colors.accent },
  { label: "Forum", icon: "chatbubbles", route: "/(tabs)/forum", color: "#6C8AE4" },
  { label: "Profile", icon: "person", route: "/(tabs)/profile", color: "#B06CE4" },
  { label: "Settings", icon: "settings", route: "/settings", color: colors.textMuted },
];

export default function HomePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const all = await getBackend().listTrips();
      setTrips(shuffle(all).slice(0, 6));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      showsVerticalScrollIndicator={false}
    >
      <ImageBackground
        source={{ uri: heroBg }}
        style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
        contentFit="cover"
      >
        <LinearGradientLike />
        <View style={styles.heroTop}>
          <Logo size="sm" onDark />
          <Pressable
            style={styles.settingsBtn}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textInverse} />
          </Pressable>
        </View>
        <View style={styles.heroContent}>
          <Text style={styles.greeting}>
            Hi {user?.username ?? "traveller"} 👋
          </Text>
          <Text style={styles.slogan}>{branding.slogan}</Text>
        </View>
      </ImageBackground>

      {/* Quick navigation */}
      <View style={styles.quickRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickScroll}
        >
          {QUICK_LINKS.map((link) => (
            <Pressable
              key={link.label}
              style={styles.quickItem}
              onPress={() => router.push(link.route as any)}
            >
              <View style={[styles.quickIcon, { backgroundColor: link.color }]}>
                <Ionicons name={link.icon} size={24} color={colors.textInverse} />
              </View>
              <Text style={styles.quickLabel}>{link.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* CTA */}
      <Pressable style={styles.cta} onPress={() => router.push("/(tabs)/share")}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaTitle}>Share your latest trip</Text>
          <Text style={styles.ctaSub}>
            Tag your photos and inspire other travellers.
          </Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={36} color={colors.primary} />
      </Pressable>

      {/* Random posts */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Fresh from the community</Text>
        <Pressable onPress={() => router.push("/(tabs)/discovery")}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.skeletonRow}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.skeleton} />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.postsScroll}
        >
          {trips.map((trip) => (
            <Pressable
              key={trip.id}
              style={styles.postCard}
              onPress={() => router.push(`/trip/${trip.id}`)}
            >
              <Image
                source={{ uri: trip.coverImage ?? undefined }}
                style={styles.postImage}
                contentFit="cover"
                transition={200}
              />
              <Badge
                label={trip.uniqueLocationCount}
                icon="location"
                style={styles.postBadge}
              />
              <View style={styles.postBody}>
                <Text style={styles.postName} numberOfLines={1}>
                  {trip.trip_name}
                </Text>
                <View style={styles.postAuthor}>
                  <Avatar
                    uri={trip.author.profile_photo}
                    name={trip.author.username}
                    size={20}
                  />
                  <Text style={styles.postAuthorName} numberOfLines={1}>
                    {trip.author.username}
                  </Text>
                  <Text style={styles.postSeason}>· {trip.season}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const CARD_W = Math.min(260, Dimensions.get("window").width * 0.7);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { height: 240, paddingHorizontal: spacing.lg, justifyContent: "space-between" },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: { paddingBottom: spacing.xl },
  greeting: {
    color: colors.textInverse,
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  slogan: {
    color: "rgba(255,255,255,0.92)",
    fontSize: fontSize.sm,
    fontStyle: "italic",
    marginTop: 4,
  },
  quickRow: { marginTop: spacing.lg },
  quickScroll: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  quickItem: { alignItems: "center", gap: spacing.xs, width: 68 },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  quickLabel: { fontSize: fontSize.xs, color: colors.text, fontWeight: "600" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  ctaTitle: { fontSize: fontSize.md, fontWeight: "800", color: colors.text },
  ctaSub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: "800", color: colors.text },
  seeAll: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
  postsScroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
  postCard: {
    width: CARD_W,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  postImage: { width: "100%", height: 150, backgroundColor: colors.surfaceMuted },
  postBadge: { position: "absolute", top: spacing.sm, left: spacing.sm },
  postBody: { padding: spacing.md, gap: spacing.xs },
  postName: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  postAuthor: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  postAuthorName: { fontSize: fontSize.xs, color: colors.textMuted, flexShrink: 1 },
  postSeason: { fontSize: fontSize.xs, color: colors.textMuted },
  skeletonRow: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg },
  skeleton: {
    width: CARD_W,
    height: 210,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
});
