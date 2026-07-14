import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Avatar } from "../../src/components/Avatar";
import { Badge } from "../../src/components/Badge";
import { Chip } from "../../src/components/Chip";
import { Loading, EmptyState } from "../../src/components/States";
import { getBackend } from "../../src/services/backend";
import type {
  PartySize,
  Season,
  TripWithDetails,
} from "../../src/services/backend/types";
import { PARTY_SIZES, SEASONS } from "../../src/services/backend/types";
import { colors, fontSize, radius, shadow, spacing } from "../../src/theme/theme";

const GAP = spacing.md;
const H_PADDING = spacing.lg;
const COL_W =
  (Dimensions.get("window").width - H_PADDING * 2 - GAP) / 2;

export default function DiscoveryPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<string | null>(null);
  const [party, setParty] = useState<PartySize | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTrips(await getBackend().listTrips());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const countries = useMemo(() => {
    const set = new Set<string>();
    trips.forEach((t) => t.countries.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [trips]);

  const filtered = useMemo(() => {
    return trips.filter((t) => {
      if (country && !t.countries.includes(country)) return false;
      if (party && t.party_size !== party) return false;
      if (season && t.season !== season) return false;
      return true;
    });
  }, [trips, country, party, season]);

  const activeFilters = [country, party, season].filter(Boolean).length;

  function clearFilters() {
    setCountry(null);
    setParty(null);
    setSeason(null);
  }

  const renderItem = ({ item, index }: { item: TripWithDetails; index: number }) => (
    <Pressable
      style={[styles.tile, { width: COL_W, marginLeft: index % 2 === 1 ? GAP : 0 }]}
      onPress={() => router.push(`/trip/${item.id}`)}
    >
      <View>
        <Image
          source={{ uri: item.coverImage ?? undefined }}
          style={styles.tileImage}
          contentFit="cover"
          transition={200}
        />
        <Badge
          label={item.uniqueLocationCount}
          icon="location"
          style={styles.tileBadge}
        />
      </View>
      <View style={styles.tileBody}>
        <Text style={styles.tileName} numberOfLines={1}>
          {item.trip_name}
        </Text>
        <View style={styles.tileAuthor}>
          <Avatar
            uri={item.author.profile_photo}
            name={item.author.username}
            size={20}
          />
          <Text style={styles.tileAuthorName} numberOfLines={1}>
            {item.author.username}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Discovery"
        subtitle="Real trips from real travellers"
        right={
          <Pressable
            style={styles.filterBtn}
            onPress={() => setFiltersOpen((o) => !o)}
          >
            <Ionicons name="options-outline" size={20} color={colors.primary} />
            {activeFilters > 0 ? (
              <View style={styles.filterCount}>
                <Text style={styles.filterCountText}>{activeFilters}</Text>
              </View>
            ) : null}
          </Pressable>
        }
      />

      {filtersOpen ? (
        <View style={styles.filters}>
          <FilterGroup label="Season">
            {SEASONS.map((s) => (
              <Chip
                key={s}
                label={s}
                active={season === s}
                onPress={() => setSeason(season === s ? null : s)}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Party size">
            {PARTY_SIZES.map((p) => (
              <Chip
                key={p}
                label={p}
                active={party === p}
                onPress={() => setParty(party === p ? null : p)}
              />
            ))}
          </FilterGroup>
          {countries.length > 0 ? (
            <FilterGroup label="Country">
              {countries.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={country === c}
                  onPress={() => setCountry(country === c ? null : c)}
                />
              ))}
            </FilterGroup>
          ) : null}
          {activeFilters > 0 ? (
            <Pressable onPress={clearFilters} style={styles.clear}>
              <Ionicons name="close-circle" size={16} color={colors.danger} />
              <Text style={styles.clearText}>Clear filters</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {loading ? (
        <Loading label="Finding adventures…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No trips match"
          subtitle="Try adjusting your filters."
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ marginBottom: GAP }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChips}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  filterCount: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  filterCountText: { color: colors.textInverse, fontSize: 10, fontWeight: "800" },
  filters: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filterGroup: { gap: spacing.xs },
  filterLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textMuted,
    marginLeft: H_PADDING,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterChips: { paddingHorizontal: H_PADDING, gap: spacing.sm },
  clear: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginLeft: H_PADDING,
  },
  clearText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: "600" },
  list: { padding: H_PADDING },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  tileImage: { width: "100%", height: COL_W, backgroundColor: colors.surfaceMuted },
  tileBadge: { position: "absolute", top: spacing.sm, left: spacing.sm },
  tileBody: { padding: spacing.md, gap: spacing.xs },
  tileName: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  tileAuthor: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  tileAuthorName: { fontSize: fontSize.xs, color: colors.textMuted, flexShrink: 1 },
});
