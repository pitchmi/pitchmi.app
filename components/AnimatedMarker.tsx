// components/AnimatedMarker.tsx — marcador con animación de entrada
// ==============================================
import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";

export function AnimatedMarker({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: ViewStyle }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 220, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, delay, useNativeDriver: true }),
    ]);
    t.start();
    return () => t.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.View style={[{ transform: [{ scale }] , opacity }, style]}>
      {children}
    </Animated.View>
  );
}
