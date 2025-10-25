import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { View, Pressable, Text, Image, ActivityIndicator } from "react-native";
import { useState } from "react";

export default function ImageUploader({ onDone }: { onDone: (urls: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const pick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return alert("Permiso denegado");
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (res.canceled || !res.assets?.length) return;
    setPreview(res.assets[0].uri);
    await upload(res.assets[0].uri);
  };

  const upload = async (uri: string) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No auth");
      const ext = uri.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const bin = await fetch(uri); const buf = await bin.blob();
      const { data, error } = await supabase.storage.from("pitches").upload(path, buf, { upsert: true, contentType: `image/${ext}` });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("pitches").getPublicUrl(data.path);
      onDone([pub.publicUrl]);
    } catch (e:any) { alert(e.message); }
    finally { setUploading(false); }
  };

  return (
    <View style={{ gap: 8 }}>
      {preview ? <Image source={{ uri: preview }} style={{ width: "100%", height: 180, borderRadius: 12 }} /> : null}
      <Pressable onPress={pick} style={{ backgroundColor:"#3d4e5e", padding:12, borderRadius:12, alignItems:"center" }}>
        {uploading ? <ActivityIndicator color="#fff" /> : <Text style={{ color:"#fff", fontWeight:"600" }}>Subir imagen</Text>}
      </Pressable>
    </View>
  );
}
