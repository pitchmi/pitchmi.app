import React from "react";
import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type Action = {
  /** Acepta cualquier nombre de Ionicons o un string libre */
  icon: keyof typeof Ionicons.glyphMap | string;
  label: string;
  onPress: () => void;
};

type Props = {
  actions: Action[];
};

export default function SpeedDial({ actions }: Props) {
  return (
    <View
      style={{
        position: "absolute",
        right: 16,
        bottom: 24,
        gap: 10,
        alignItems: "flex-end",
      }}
    >
      {actions.map((a, idx) => (
        <Pressable
          key={`${a.label}-${idx}`}
          onPress={a.onPress}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#111827",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 16,
            gap: 8,
          }}
        >
          <Ionicons
            // si no existe el nombre, Ionicons ignora y no crashea
            name={a.icon as any}
            size={18}
            color="#fff"
          />
          <Text style={{ color: "#fff", fontWeight: "700" }}>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
