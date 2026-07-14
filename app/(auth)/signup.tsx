import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { AuthScreen } from "../../src/components/AuthScreen";
import { TextField } from "../../src/components/TextField";
import { Button } from "../../src/components/Button";
import { SocialAuthButtons } from "../../src/components/SocialAuthButtons";
import { useAuth } from "../../src/context/AuthContext";
import { isValidEmail } from "../../src/lib/utils";
import { colors, fontSize, spacing } from "../../src/theme/theme";

export default function SignUpPage() {
  const { signUpWithEmail } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (username.trim().length < 2) return setError("Choose a username.");
    if (!isValidEmail(email)) return setError("Enter a valid email address.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");
    try {
      setLoading(true);
      const { needsConfirmation } = await signUpWithEmail(
        email,
        password,
        username
      );
      if (needsConfirmation) {
        Alert.alert(
          "Confirm your email",
          "We've sent you a confirmation link. Please verify your email, then log in."
        );
        router.replace("/(auth)/login");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (e: any) {
      setError(e?.message ?? "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen
      title="Create your account"
      subtitle="It's about experiences, not appearances."
    >
      <TextField
        label="Username"
        icon="person-outline"
        placeholder="globe_trotter"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
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
        placeholder="At least 6 characters"
        secureTextEntry
        secureToggle
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Sign up" onPress={onSubmit} loading={loading} />

      <SocialAuthButtons />

      <View style={styles.footer}>
        <Text style={styles.muted}>Already have an account? </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={styles.link}>Log in</Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: fontSize.sm },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  muted: { color: colors.textMuted, fontSize: fontSize.sm },
  link: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
});
