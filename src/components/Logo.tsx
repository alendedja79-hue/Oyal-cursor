import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../theme/theme";
import { branding } from "../theme/theme";

interface Props {
  size?: "sm" | "md" | "lg";
  showSlogan?: boolean;
  onDark?: boolean;
}

export function Logo({ size = "md", showSlogan = false, onDark = false }: Props) {
  const scale = size === "lg" ? 1.4 : size === "sm" ? 0.8 : 1;
  const textColor = onDark ? colors.textInverse : colors.text;
  const sloganColor = onDark ? "rgba(255,255,255,0.9)" : colors.textMuted;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.mark, { width: 40 * scale, height: 40 * scale }]}>
          <Ionicons name="compass" size={24 * scale} color={colors.textInverse} />
        </View>
        <Text style={[styles.name, { fontSize: fontSize.xxl * scale, color: textColor }]}>
          Oyal
        </Text>
      </View>
      {showSlogan ? (
        <Text style={[styles.slogan, { color: sloganColor }]}>
          {branding.slogan}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  mark: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontWeight: "900", letterSpacing: 0.5 },
  slogan: { fontSize: fontSize.sm, fontStyle: "italic", textAlign: "center" },
});
