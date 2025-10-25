// components/PitchCallout.tsx — callout con imagen (cache) + guardar
// ==============================================
import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image"; // caching por defecto

export function PitchCallout({ title, imageUrl, pitchId, isMine }: { title: string; imageUrl?: string | null; pitchId: string; isMine: boolean }) {
  return (
    <View style={{ maxWidth: 260 }}>
      <Text style={{ fontWeight: "600", fontSize: 16 }}>
        {title} {isMine ? " · (tuyo)" : ""}
      </Text>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 240, height: 120, borderRadius: 10, marginTop: 8, backgroundColor: "#eef2f5" }}
          contentFit="cover"
          transition={150}
        />
      ) : null}
      <Text style={{ opacity: 0.7, marginTop: 6 }}>
        {imageUrl ? "Ver detalle →" : "Abrir detalle →"}
      </Text>
      {/* SaveButton se renderiza desde index.tsx */}
    </View>
  );
}
