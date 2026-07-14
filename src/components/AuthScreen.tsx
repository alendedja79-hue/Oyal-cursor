import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ImageBackground } from "expo-image";
import { LinearGradientLike } from "./Gradient";
import { Logo } from "./Logo";
import { colors, radius, spacing, fontSize } from "../theme/theme";
import { randomBackground } from "../theme/theme";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const bg = randomBackground();

export function AuthScreen({ title, subtitle, children }: Props) {
  return (
    <View style={styles.root}>
      <ImageBackground source={{ uri: bg }} style={styles.hero} contentFit="cover">
        <LinearGradientLike />
        <View style={styles.heroContent}>
          <Logo size="lg" showSlogan onDark />
        </View>
      </ImageBackground>

      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.sheet}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.form}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { height: 300, justifyContent: "flex-end" },
  heroContent: { alignItems: "center", paddingBottom: spacing.xxl },
  sheetWrap: { flex: 1, marginTop: -32 },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
    flexGrow: 1,
  },
  title: { fontSize: fontSize.xxl, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted },
  form: { marginTop: spacing.lg, gap: spacing.lg },
});
