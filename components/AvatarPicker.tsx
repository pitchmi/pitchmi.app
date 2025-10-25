// components/AvatarPicker.tsx
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { AVATARS, AvatarKey } from "@/lib/avatars";

const C = "#3d4e5e";

export default function AvatarPicker({
  value,
  onChange,
}: {
  value: AvatarKey;
  onChange: (k: AvatarKey) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: C, fontWeight: "700" }}>Elige tu avatar</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {AVATARS.map((a) => {
          const selected = value === a.key;
          return (
            <Pressable
              key={a.key}
              onPress={() => onChange(a.key)}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                overflow: "hidden",
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? "#2f6bff" : "rgba(61,78,94,0.2)",
              }}
            >
              <Image source={a.src} style={{ width: "100%", height: "100%" }} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
