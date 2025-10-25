// components/Skeleton.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

/** Barra shimmer reutilizable */
export function SkeletonBar(props: {
  width?: number | string;
  height?: number;
  radius?: number;
}) {
  const { width = "100%", height = 14, radius = 8 } = props;

  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_W, SCREEN_W],
  });

  return (
    <View
      // ❗️Nada de ViewStyle tipado aquí: RN acepta number | string sin dramas
      style={[
        styles.block,
        { width: width as any, height, borderRadius: radius },
      ]}
    >
      <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]} />
    </View>
  );
}

/** Esqueleto del header tipo hero */
export function SkeletonHero() {
  return (
    <View style={styles.hero}>
      <View style={{ padding: 16, gap: 10, justifyContent: "flex-end", flex: 1 }}>
        <SkeletonBar width={220} height={22} radius={6} />
        <SkeletonBar width={140} height={14} radius={6} />
      </View>
    </View>
  );
}

/** Esqueleto de tarjeta del grid */
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonBar width={"100%"} height={180} radius={16} />
      <View style={{ padding: 10, gap: 8 }}>
        <SkeletonBar width={160} height={14} />
        <SkeletonBar width={80} height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: "hidden",
    backgroundColor: "#EEF2F7",
  },
  shimmer: {
    height: "100%",
    width: "50%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.45)",
    opacity: 0.9,
  },
  hero: {
    height: 320,
    backgroundColor: "#F1F5F9",
    justifyContent: "flex-end",
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "white",
  },
});
