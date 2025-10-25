// components/SpeedDialTerms.tsx
import React from "react";
import { Pressable, Text, View, Platform } from "react-native";

type Props = {
  onOpen: () => void;   // abrir modal de términos
  bottom?: number;      // posición Y
  right?: number;       // posición X
  label?: string;       // texto opcional
};

export default function SpeedDialTerms({
  onOpen,
  bottom = 24,
  right = 16,
  label = "Términos",
}: Props) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom,
        right,
      }}
    >
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: "#111827",
          opacity: pressed ? 0.8 : 1,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: Platform.OS === "android" ? 4 : 0,
        })}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>ⓘ {label}</Text>
      </Pressable>
    </View>
  );
}
