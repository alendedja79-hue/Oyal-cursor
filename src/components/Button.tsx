import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, fontSize } from "../theme/theme";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  const palette = getPalette(variant);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border },
        variant === "outline" || variant === "ghost" ? styles.bordered : null,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons name={icon} size={18} color={palette.text} />
          ) : null}
          <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

function getPalette(variant: Variant) {
  switch (variant) {
    case "secondary":
      return { bg: colors.accent, text: colors.textInverse, border: "transparent" };
    case "outline":
      return { bg: "transparent", text: colors.primary, border: colors.primary };
    case "ghost":
      return { bg: "transparent", text: colors.text, border: colors.border };
    case "danger":
      return { bg: colors.danger, text: colors.textInverse, border: "transparent" };
    default:
      return { bg: colors.primary, text: colors.textInverse, border: "transparent" };
  }
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  bordered: { borderWidth: 1.5 },
  fullWidth: { alignSelf: "stretch" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { fontSize: fontSize.md, fontWeight: "700" },
});
