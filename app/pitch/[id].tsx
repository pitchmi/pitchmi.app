import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { getPitch, Pitch } from "@/services/pitches";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { openMaps } from "@/utils/openMaps";
import FavoriteButton from "@/components/FavoriteButton";

export default function PitchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [p, setP] = useState<Pitch | null>(null);

  useEffect(()=>{ getPitch(id).then(setP).catch(e=>alert(e.message)); },[id]);
  if (!p) return null;

  return (
    <ScrollView contentContainerStyle={{ padding:16, gap:12 }}>
      <Text style={{ fontSize:24, fontWeight:"800", color:"#3d4e5e" }}>{p.title}</Text>
      {!!p.image_urls?.[0] && <Image source={{ uri: p.image_urls[0] }} style={{ width:"100%", height:220, borderRadius:12 }}/>}
      {!!p.description && <Text style={{ fontSize:16, color:"#111827" }}>{p.description}</Text>}
      <View style={{ flexDirection:"row", gap:12 }}>
        <Pressable onPress={()=>openMaps(p.lat, p.lng, p.title)} style={{ backgroundColor:"#111827", padding:12, borderRadius:12 }}>
          <Text style={{ color:"#fff" }}>Ver cómo llegar</Text>
        </Pressable>
        <FavoriteButton pitchId={p.id}/>
      </View>
    </ScrollView>
  );
}
