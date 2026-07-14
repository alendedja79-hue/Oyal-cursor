import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { TextField } from "../src/components/TextField";
import { Button } from "../src/components/Button";
import { useAuth } from "../src/context/AuthContext";
import { getBackend } from "../src/services/backend";
import { colors, fontSize, spacing } from "../src/theme/theme";

export default function NewTopicPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onCreate() {
    setError(null);
    if (title.trim().length < 5) {
      setError("Give your topic a descriptive title (5+ characters).");
      return;
    }
    if (!user) return;
    try {
      setSubmitting(true);
      const topic = await getBackend().createTopic(user.id, title);
      router.replace(`/forum/${topic.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Unable to create topic.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New topic</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.hint}>
          Start a discussion — ask a question or share an experience with the
          community.
        </Text>
        <TextField
          label="Topic title"
          icon="chatbubble-ellipses-outline"
          placeholder="e.g. Best time to visit Iceland?"
          value={title}
          onChangeText={setTitle}
          autoFocus
          multiline
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Create topic"
          icon="add"
          onPress={onCreate}
          loading={submitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: "800", color: colors.text },
  body: { padding: spacing.lg, gap: spacing.lg },
  hint: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
