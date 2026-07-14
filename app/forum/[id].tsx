import React, { useCallback, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Avatar } from "../../src/components/Avatar";
import { Loading } from "../../src/components/States";
import { useAuth } from "../../src/context/AuthContext";
import { getBackend } from "../../src/services/backend";
import type {
  ForumPostWithAuthor,
  ForumTopicWithDetails,
} from "../../src/services/backend/types";
import { timeAgo } from "../../src/lib/utils";
import { colors, fontSize, radius, shadow, spacing } from "../../src/theme/theme";

export default function TopicDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [topic, setTopic] = useState<ForumTopicWithDetails | null>(null);
  const [posts, setPosts] = useState<ForumPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const backend = getBackend();
    const [t, p] = await Promise.all([
      backend.getTopic(String(id)),
      backend.listPosts(String(id)),
    ]);
    setTopic(t);
    setPosts(p);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function send() {
    if (!message.trim() || !user) return;
    try {
      setSending(true);
      await getBackend().createPost(String(id), user.id, message);
      setMessage("");
      await load();
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Loading label="Loading discussion…" />;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <ScreenHeader
        title="Discussion"
        onBack={() => router.back()}
      />
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          topic ? (
            <View style={styles.topicHeader}>
              <Text style={styles.topicTitle}>{topic.title}</Text>
              <View style={styles.topicMeta}>
                <Avatar
                  uri={topic.author.profile_photo}
                  name={topic.author.username}
                  size={28}
                />
                <Text style={styles.topicAuthor}>{topic.author.username}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.topicTime}>{timeAgo(topic.created_at)}</Text>
              </View>
              <Text style={styles.replyHeading}>
                {posts.length} {posts.length === 1 ? "reply" : "replies"}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.post}>
            <Avatar
              uri={item.author.profile_photo}
              name={item.author.username}
              size={36}
            />
            <View style={styles.postBubble}>
              <View style={styles.postTop}>
                <Text style={styles.postAuthor}>{item.author.username}</Text>
                <Text style={styles.postTime}>{timeAgo(item.created_at)}</Text>
              </View>
              <Text style={styles.postMessage}>{item.message}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Be the first to reply.</Text>
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.composer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment…"
          placeholderTextColor={colors.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <Pressable
          style={[styles.send, !message.trim() && styles.sendDisabled]}
          onPress={send}
          disabled={!message.trim() || sending}
        >
          <Ionicons name="send" size={18} color={colors.textInverse} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  topicHeader: { gap: spacing.sm, marginBottom: spacing.sm },
  topicTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.text },
  topicMeta: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  topicAuthor: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "700" },
  dot: { color: colors.textMuted },
  topicTime: { fontSize: fontSize.xs, color: colors.textMuted },
  replyHeading: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  post: { flexDirection: "row", gap: spacing.sm },
  postBubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadow.soft,
  },
  postTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  postAuthor: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  postTime: { fontSize: fontSize.xs, color: colors.textMuted },
  postMessage: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { backgroundColor: colors.primaryLight },
});
