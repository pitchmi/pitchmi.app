// app/u/[id].tsx
import React, { useEffect, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase";

const C = "#3d4e5e";
const BORDER = "#e8eef3";

type Profile = { id: string; username: string | null; avatar_url: string | null; bio: string | null };
type Pitch = { id: string; title: string | null; description: string | null; image_urls: string[] | null; created_at: string };

export default function PublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Pitch[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: prof, error: e1 } = await supabase
          .from("profiles")
          .select("id,username,avatar_url,bio")
          .eq("id", id!)
          .maybeSingle();
        if (e1) throw e1;
        setP((prof as Profile) ?? null);

        const { data: list, error: e2 } = await supabase
          .from("pitches")
          .select("id,title,description,image_urls,created_at")
          .eq("user_id", id!)
          .order("created_at", { ascending: false })
          .limit(12);
        if (e2) throw e2;
        setPosts((list as Pitch[]) ?? []);
      } catch (e:any) {
        Alert.alert("Perfil", e?.message ?? "No se pudo cargar.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const report = () => {
    const mail = `mailto:admin@pitchmi.app?subject=Reporte%20de%20usuario&body=Usuario%20ID:%20${id}`;
    Linking.openURL(mail).catch(() => {});
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:"#f9fcfd" }}>
      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:24 }}>
        <View style={s.card}>
          <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
            <Image
              source={p?.avatar_url ? { uri:p.avatar_url } : require("@/assets/placeholder.png")}
              style={{ width:72, height:72, borderRadius:36, backgroundColor:"#eef2f6" }}
            />
            <View style={{ flex:1 }}>
              <Text style={{ color:C, fontWeight:"900", fontSize:20 }}>{p?.username ?? "Usuario"}</Text>
              {!!p?.bio && <Text style={{ color:"rgba(61,78,94,0.8)" }}>{p.bio}</Text>}
            </View>
          </View>
          <Pressable onPress={report} style={s.report}><Text style={s.reportTxt}>Reportar</Text></Pressable>
        </View>

        <Text style={{ color:C, fontWeight:"900", marginTop:16, marginBottom:8 }}>Últimos pitch</Text>
        {posts.map((x) => {
          const img = Array.isArray(x.image_urls) && x.image_urls[0] ? x.image_urls[0] : null;
          return (
            <Pressable key={x.id} onPress={()=>router.push({ pathname:"/portafolio", params:{ id:x.id }})} style={s.post}>
              {img ? <Image source={{ uri: img }} style={s.thumb} /> : <View style={[s.thumb,{ backgroundColor:"#eef2f6"}]} />}
              <View style={{ flex:1 }}>
                <Text numberOfLines={1} style={{ color:"#111827", fontWeight:"800" }}>{x.title ?? "Sin título"}</Text>
                <Text numberOfLines={2} style={{ color:"#4b5563", fontSize:12 }}>{x.description ?? ""}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  card:{ backgroundColor:"#fff", borderRadius:16, padding:14, borderWidth:1, borderColor:BORDER, shadowColor:"#000", shadowOpacity:0.08, shadowRadius:8, shadowOffset:{width:0,height:4}, elevation:4 },
  report:{ marginTop:12, alignSelf:"flex-start", backgroundColor:"#fee2e2", paddingHorizontal:12, paddingVertical:8, borderRadius:10 },
  reportTxt:{ color:"#7f1d1d", fontWeight:"900" },
  post:{ flexDirection:"row", gap:10, backgroundColor:"#fff", borderRadius:14, padding:10, borderWidth:1, borderColor:BORDER, marginBottom:10 },
  thumb:{ width:72, height:72, borderRadius:10, marginRight:6 },
});
