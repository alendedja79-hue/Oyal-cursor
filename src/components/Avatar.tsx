import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { colors } from "../theme/theme";

interface Props {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 44 }: Props) {
  const initials = (name ?? "?")
    .split(/[\s._]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const dim = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.img, dim]}
        contentFit="cover"
        transition={200}
      />
    );
  }
  return (
    <View style={[styles.fallback, dim]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: colors.surfaceMuted },
  fallback: {
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: colors.textInverse, fontWeight: "800" },
});
