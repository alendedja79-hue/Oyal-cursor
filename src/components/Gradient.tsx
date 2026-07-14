import React from "react";
import { StyleSheet, View } from "react-native";

/**
 * Lightweight faux vertical gradient (no extra native dependency). Stacks a few
 * translucent dark bands so hero images stay legible under white text.
 */
export function LinearGradientLike() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.band, { top: 0, opacity: 0.15 }]} />
      <View style={[styles.band, { top: "40%", opacity: 0.3 }]} />
      <View style={[styles.band, { top: "70%", opacity: 0.55 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#031A1A",
  },
});
