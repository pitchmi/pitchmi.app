import React from "react";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BrandTitle() {
  const insets = useSafeAreaInsets();
  const serif = Platform.select({ ios: "Baskerville", android: "serif" });
  const sans = Platform.select({ ios: "Helvetica", android: "sans-serif" });

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: insets.top + 6, alignSelf: "center", zIndex: 20 }}
    >
      <View style={{
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.9)", borderWidth: 1, borderColor: "#e5e7eb"
      }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#3d4e5e", textAlign: "center", fontFamily: serif }}>
          Pitchmi
        </Text>
        <Text style={{ fontSize: 12, color: "#3d4e5e", opacity: 0.7, textAlign: "center", fontFamily: sans }}>
          tu mapa del ahora
        </Text>
      </View>
    </View>
  );
}
