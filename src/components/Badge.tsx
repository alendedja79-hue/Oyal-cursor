import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, fontSize } from "../theme/theme";

interface Props {
  label: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  style?: ViewStyle;
}

export function Badge({ label, icon, color = colors.badge, style }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: color }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={colors.textInverse} /> : null}
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  text: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
    fontWeight: "800",
  },
});
