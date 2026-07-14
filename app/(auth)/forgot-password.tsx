import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthScreen } from "../../src/components/AuthScreen";
import { TextField } from "../../src/components/TextField";
import { Button } from "../../src/components/Button";
import { useAuth } from "../../src/context/AuthContext";
import { isValidEmail } from "../../src/lib/utils";
import { colors, fontSize, spacing } from "../../src/theme/theme";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!isValidEmail(email)) return setError("Enter a valid email address.");
    try {
      setLoading(true);
      await sendPasswordReset(email);
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthScreen title="Check your inbox">
        <View style={styles.success}>
          <Ionicons name="mail-open-outline" size={56} color={colors.primary} />
          <Text style={styles.successText}>
            If an account exists for {email}, we've sent a link to reset your
            password.
          </Text>
        </View>
        <Link href="/(auth)/login" asChild>
          <Button label="Back to login" onPress={() => {}} />
        </Link>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Reset password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <TextField
        label="Email"
        icon="mail-outline"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label="Send reset link" onPress={onSubmit} loading={loading} />

      <View style={styles.footer}>
        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={styles.link}>Back to login</Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: fontSize.sm },
  success: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg },
  successText: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  footer: { alignItems: "center", marginTop: spacing.sm },
  link: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
});
