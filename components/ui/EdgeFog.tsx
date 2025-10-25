import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

export default function EdgeFog({ width = 22 }: { width?: number }) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, zIndex: 10 }}>
      <LinearGradient
        colors={["rgba(255,255,255,0.85)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ position: "absolute", left: 0, top: 0, bottom: 0, width }}
      />
      <LinearGradient
        colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.85)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width }}
      />
    </View>
  );
}
