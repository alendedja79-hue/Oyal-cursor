import React, { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Avatar } from "../../src/components/Avatar";
import { Loading, EmptyState } from "../../src/components/States";
import { getBackend } from "../../src/services/backend";
import type { ForumTopicWithDetails } from "../../src/services/backend/types";
import { timeAgo } from "../../src/lib/utils";
import { colors, fontSize, radius, shadow, spacing } from "../../src/theme/theme";

export default function ForumPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<ForumTopicWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setTopics(await getBackend().listTopics());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderItem = ({ item }: { item: ForumTopicWithDetails }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/forum/${item.id}`)}
    >
      <Avatar
        uri={item.author.profile_photo}
        name={item.author.username}
        size={44}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.author}>{item.author.username}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>
      <View style={styles.replies}>
        <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
        <Text style={styles.replyCount}>{item.replyCount}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Forum"
        subtitle="Ask, share, and swap travel tips"
        right={
          <Pressable
            style={styles.newBtn}
            onPress={() => router.push("/new-topic")}
          >
            <Ionicons name="add" size={20} color={colors.textInverse} />
            <Text style={styles.newBtnText}>New</Text>
          </Pressable>
        }
      />

      {loading ? (
        <Loading label="Loading discussions…" />
      ) : topics.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No topics yet"
          subtitle="Start the first discussion!"
        />
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  newBtnText: { color: colors.textInverse, fontWeight: "700", fontSize: fontSize.sm },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  title: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: 4 },
  author: { fontSize: fontSize.xs, color: colors.primary, fontWeight: "600" },
  dot: { color: colors.textMuted },
  time: { fontSize: fontSize.xs, color: colors.textMuted },
  replies: { alignItems: "center", gap: 2 },
  replyCount: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: "700" },
});
