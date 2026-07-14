import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing, fontSize } from "../theme/theme";

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.active]}
      accessibilityRole="button"
    >
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontSize: fontSize.sm, color: colors.text, fontWeight: "600" },
  activeText: { color: colors.textInverse },
});
