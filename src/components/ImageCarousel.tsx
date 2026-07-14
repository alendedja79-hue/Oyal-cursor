import React, { useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, fontSize } from "../theme/theme";
import type { Photo } from "../services/backend/types";

interface Props {
  photos: Photo[];
  height?: number;
  width: number;
}

/**
 * Swipeable image carousel that overlays the tagged location on each slide, so
 * users can slide through photos while reading the trip's other information.
 */
export function ImageCarousel({ photos, width, height = 260 }: Props) {
  const [index, setIndex] = useState(0);
  const ref = useRef<ScrollView>(null);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  }

  if (photos.length === 0) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Ionicons name="image-outline" size={40} color={colors.primaryLight} />
      </View>
    );
  }

  return (
    <View style={{ width, height }}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {photos.map((photo) => (
          <View key={photo.id} style={{ width, height }}>
            <Image
              source={{ uri: photo.image_url }}
              style={{ width, height }}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.locationPill}>
              <Ionicons name="location" size={13} color={colors.textInverse} />
              <Text style={styles.locationText} numberOfLines={1}>
                {photo.location_name}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {photos.length > 1 ? (
        <>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {index + 1}/{photos.length}
            </Text>
          </View>
          <View style={styles.dots}>
            {photos.map((p, i) => (
              <View
                key={p.id}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  locationPill: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "80%",
    backgroundColor: "rgba(6, 30, 30, 0.7)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  locationText: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  counter: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: "rgba(6, 30, 30, 0.6)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  counterText: { color: colors.textInverse, fontSize: fontSize.xs, fontWeight: "700" },
  dots: {
    position: "absolute",
    bottom: spacing.sm,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: { backgroundColor: colors.textInverse, width: 18 },
});
