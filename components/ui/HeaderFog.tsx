import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = { height?: number };

/** Niebla blanca superior. No bloquea toques. */
export default function HeaderFog({ height = 128 }: Props) {
  return (
    <View pointerEvents="none" style={{ height, width: "100%" }}>
      <LinearGradient
        colors={["rgba(255,255,255,0.96)", "rgba(255,255,255,0.7)", "rgba(255,255,255,0)"]}
        locations={[0, 0.35, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height }}
      />
      <LinearGradient
        colors={["rgba(255,255,255,0.85)", "rgba(255,255,255,0)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: -40,
          right: -40,
          height: height * 0.7,
          borderBottomLeftRadius: 48,
          borderBottomRightRadius: 48,
        }}
      />
    </View>
  );
}
