import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { AuthScreen } from "../../src/components/AuthScreen";
import { TextField } from "../../src/components/TextField";
import { Button } from "../../src/components/Button";
import { SocialAuthButtons } from "../../src/components/SocialAuthButtons";
import { useAuth } from "../../src/context/AuthContext";
import { isValidEmail } from "../../src/lib/utils";
import { usingMockBackend } from "../../src/services/backend";
import { colors, fontSize, spacing } from "../../src/theme/theme";

export default function LoginPage() {
  const { signInWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!isValidEmail(email)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    try {
      setLoading(true);
      await signInWithEmail(email, password);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e?.message ?? "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen title="Welcome back" subtitle="Log in to keep exploring.">
      <TextField
        label="Email"
        icon="mail-outline"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label="Password"
        icon="lock-closed-outline"
        placeholder="Your password"
        secureTextEntry
        secureToggle
        value={password}
        onChangeText={setPassword}
      />

      <Link href="/(auth)/forgot-password" asChild>
        <Pressable style={styles.forgot}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
      </Link>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Log in" onPress={onSubmit} loading={loading} />

      <SocialAuthButtons />

      <View style={styles.footer}>
        <Text style={styles.muted}>New to Oyal? </Text>
        <Link href="/(auth)/signup" asChild>
          <Pressable>
            <Text style={styles.link}>Create an account</Text>
          </Pressable>
        </Link>
      </View>

      {usingMockBackend ? (
        <Text style={styles.demo}>
          Demo mode — try maya@oyal.app / password, or sign up freely.
        </Text>
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: "flex-end" },
  link: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
  error: { color: colors.danger, fontSize: fontSize.sm },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  muted: { color: colors.textMuted, fontSize: fontSize.sm },
  demo: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
    fontStyle: "italic",
  },
});
