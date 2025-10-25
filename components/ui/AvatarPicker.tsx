// components/ui/AvatarPicker.tsx
import React from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { AVATARS, type AvatarKey } from "@/lib/avatars";

const C = "#3d4e5e";

export default function AvatarPicker({
  value,
  onChange,
}: {
  value: AvatarKey | null;
  onChange: (k: AvatarKey) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
      {AVATARS.map((a) => {
        const active = a.key === value;
        return (
          <Pressable
            key={a.key}
            onPress={() => onChange(a.key)}
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              overflow: "hidden",
              borderWidth: active ? 3 : 1,
              borderColor: active ? "#2f6bff" : "rgba(61,78,94,0.2)",
              backgroundColor: "rgba(61,78,94,0.06)",
            }}
          >
            <Image source={a.src} style={{ width: "100%", height: "100%" }} />
          </Pressable>
        );
      })}
      <View style={{ width: 4 }} />
    </ScrollView>
  );
}
