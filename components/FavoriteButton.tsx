import * as Haptics from "expo-haptics";
import { Pressable, Text } from "react-native";
import { toggleFavorite } from "@/services/pitches";
import { useState } from "react";

export default function FavoriteButton({ pitchId, initial }: { pitchId: string; initial?: boolean }) {
  const [saved, setSaved] = useState(!!initial);
  const onPress = async () => {
    const r = await toggleFavorite(pitchId);
    setSaved(r.saved);
    Haptics.selectionAsync();
  };
  return (
    <Pressable onPress={onPress} style={{ paddingVertical:8, paddingHorizontal:12, borderRadius:12, backgroundColor: saved ? "#0ea5e9" : "#e5e7eb" }}>
      <Text style={{ color: saved ? "#fff" : "#111827" }}>{saved ? "Guardado" : "Guardar"}</Text>
    </Pressable>
  );
}
