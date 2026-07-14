import React, { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, fontSize } from "../theme/theme";
import type { OAuthProvider } from "../services/backend/types";

export function SocialAuthButtons() {
  const { signInWithOAuth } = useAuth();
  const [loading, setLoading] = useState<OAuthProvider | null>(null);

  async function handle(provider: OAuthProvider) {
    try {
      setLoading(provider);
      await signInWithOAuth(provider);
    } catch (e: any) {
      Alert.alert("Sign in failed", e?.message ?? "Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.line} />
      </View>

      <Button
        label="Continue with Google"
        icon="logo-google"
        variant="ghost"
        loading={loading === "google"}
        onPress={() => handle("google")}
      />
      {Platform.OS !== "android" ? (
        <Button
          label="Continue with Apple"
          icon="logo-apple"
          variant="ghost"
          loading={loading === "apple"}
          onPress={() => handle("apple")}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: fontSize.xs },
});
