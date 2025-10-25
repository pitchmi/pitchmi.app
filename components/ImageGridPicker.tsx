// components/ImageGridPicker.tsx
import { useState } from "react";
import { View, Image, Pressable, ActivityIndicator, Text } from "react-native";
import { pickOneImage } from "@/lib/images";
import { uploadToPitches } from "@/lib/upload";

export default function ImageGridPicker({
  value, onChange, max = 5,
}: { value: string[]; onChange: (urls: string[]) => void; max?: number }) {
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (busy || value.length >= max) return;
    try {
      setBusy(true);
      const picked = await pickOneImage();
      if (!picked) return;
      const url = await uploadToPitches(picked.uri, picked.mime);
      onChange([...value, url]);
    } catch (e: any) {
      alert(e.message);
    } finally { setBusy(false); }
  };

  const remove = (u: string) => onChange(value.filter((x) => x !== u));

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {value.map((u) => (
        <View key={u} style={{ position: "relative" }}>
          <Image source={{ uri: u }} style={{ width: 96, height: 96, borderRadius: 12 }} />
          <Pressable onPress={() => remove(u)} style={{
            position: "absolute", top: -8, right: -8, backgroundColor: "#111827",
            width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ color: "#fff", fontWeight: "800", lineHeight: 20, fontSize: 16 }}>×</Text>
          </Pressable>
        </View>
      ))}
      {value.length < max && (
        <Pressable onPress={add} disabled={busy} style={{
          width: 96, height: 96, borderRadius: 12, borderWidth: 1, borderColor: "#d0d7de",
          alignItems: "center", justifyContent: "center", opacity: busy ? 0.6 : 1,
        }}>
          {busy ? <ActivityIndicator /> : <Text style={{ fontWeight: "700", color: "#3d4e5e" }}>+ Añadir</Text>}
        </Pressable>
      )}
    </View>
  );
}
