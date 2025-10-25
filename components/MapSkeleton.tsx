// components/MapSkeleton.tsx
import React from "react";
import { View } from "react-native";

export default function MapSkeleton() {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: "#f3f4f6",
      }}
    >
      {/* barras simuladas */}
      <View
        style={{
          position: "absolute",
          top: 44,
          left: 12,
          right: 12,
          height: 44,
          backgroundColor: "#e5e7eb",
          borderRadius: 12,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 96,
          left: 12,
          right: 12,
          height: 36,
          backgroundColor: "#e5e7eb",
          borderRadius: 999,
        }}
      />
    </View>
  );
}
