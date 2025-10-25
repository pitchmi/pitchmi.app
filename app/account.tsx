// app/account.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, Image, Linking, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";

const C = "#3d4e5e";
const BG = "#f9fcfd";
const BLUE = "#2F6BFF";
const BORDER = "#e8eef3";

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
};

function base64ToBytes(b64: string) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const clean = b64.replace(/[\r\n]+/g, "");
  let i = 0, p = 0;
  const len = clean.length;
  let outLen = (len * 3) / 4;
  if (clean.endsWith("==")) outLen -= 2;
  else if (clean.endsWith("=")) outLen -= 1;
  const bytes = new Uint8Array(outLen);
  while (i < len) {
    const e1 = chars.indexOf(clean[i++]);
    const e2 = chars.indexOf(clean[i++]);
    const e3 = chars.indexOf(clean[i++]);
    const e4 = chars.indexOf(clean[i++]);
    const n = (e1 << 18) | (e2 << 12) | ((e3 & 63) << 6) | (e4 & 63);
    if (p < outLen) bytes[p++] = (n >> 16) & 255;
    if (p < outLen) bytes[p++] = (n >> 8) & 255;
    if (p < outLen) bytes[p++] = n & 255;
  }
  return bytes;
}

async function uploadAvatar(uri: string, userId: string) {
  const b64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
  const bytes = base64ToBytes(b64);
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage.from("avatars").upload(path, bytes.buffer, {
    contentType: "image/jpeg", upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export default function Account() {
  const { session } = useSession();
  const uid = session?.user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,username,avatar_url,bio")
        .eq("id", uid)
        .maybeSingle();
      if (error) throw error;
      const p = (data as Profile | null) ?? null;

      if (!p) {
        const { error: e2 } = await supabase.from("profiles").insert({ id: uid });
        if (e2) throw e2;
        setUsername("");
        setBio("");
        setAvatar(null);
      } else {
        setUsername(p.username ?? "");
        setBio(p.bio ?? "");
        setAvatar(p.avatar_url ?? null);
      }
    } catch (e: any) {
      Alert.alert("Perfil", e?.message ?? "No se pudo cargar el perfil.");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permiso denegado", "Autoriza la galería para elegir un avatar."); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85,
    });
    if ((res as any).canceled) return;
    const a = (res as any).assets?.[0];
    if (!a?.uri || !uid) return;
    try {
      setSaving(true);
      const url = await uploadAvatar(a.uri, uid);
      setAvatar(url);
    } catch (e:any) {
      Alert.alert("Avatar", e?.message ?? "No se pudo subir el avatar.");
    } finally {
      setSaving(false);
    }
  };

  const clearAvatar = () => setAvatar(null);

  const onSave = async () => {
    if (!uid) return;
    if (!username.trim()) { Alert.alert("Falta nombre", "Elige un pseudónimo."); return; }
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: uid, username: username.trim(), bio: bio.trim() || null, avatar_url: avatar ?? null }, { onConflict: "id" });
      if (error) throw error;
      Alert.alert("Guardado", "Perfil actualizado.");
    } catch (e:any) {
      const msg = String(e?.message ?? "");
      if (msg.toLowerCase().includes("unique")) {
        Alert.alert("Nombre en uso", "Prueba con otro pseudónimo.");
      } else {
        Alert.alert("No guardado", msg || "Error al guardar.");
      }
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  const report = () => {
    const mail = `mailto:admin@pitchmi.app?subject=Reporte%20de%20problema&body=ID%20usuario:%20${uid}`;
    Linking.openURL(mail).catch(() => {});
  };

  if (!uid) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: C, fontWeight: "900", fontSize: 18, textAlign: "center" }}>Inicia sesión para ver tu perfil</Text>
        <Pressable onPress={() => router.replace("/auth")} style={[styles.primary, { marginTop: 14 }]}>
          <Text style={styles.primaryTxt}>Entrar / Registrar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <Text style={styles.h1}>Tu perfil</Text>
        <Text style={styles.sub}>Configura tu identidad en Pitchmi.</Text>

        <View style={{ marginTop: 16 }}>
          <Text style={styles.label}>Avatar</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Image
              source={avatar ? { uri: avatar } : require("@/assets/placeholder.png")}
              style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: "#eef2f6" }}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable onPress={pickAvatar} style={[styles.chip]}>
                <Text style={styles.chipTxt}>{saving ? "Subiendo…" : "Cambiar"}</Text>
              </Pressable>
              {avatar ? (
                <Pressable onPress={clearAvatar} style={[styles.chip, { backgroundColor: "#fee2e2" }]}>
                  <Text style={[styles.chipTxt, { color: "#7f1d1d", fontWeight: "900" }]}>Quitar</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={styles.label}>Pseudónimo</Text>
          <View style={styles.inputBox}>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="ej. caminante87"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={styles.label}>Descripción</Text>
          <View style={[styles.inputBox, { minHeight: 110 }]}>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Cuéntanos algo corto..."
              placeholderTextColor="#9ca3af"
              multiline
              style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]}
            />
          </View>
        </View>

        <Pressable onPress={onSave} disabled={saving || loading} style={[styles.primary, { marginTop: 16, opacity: (saving || loading) ? 0.6 : 1 }]}>
          <Text style={styles.primaryTxt}>Guardar cambios</Text>
        </Pressable>

        <Text style={styles.section}>Acciones</Text>
        <Pressable onPress={() => router.push({ pathname: "/u/[id]", params: { id: uid } })} style={styles.row}>
          <Text style={styles.rowTxt}>Ver perfil público</Text>
        </Pressable>
        <Pressable onPress={report} style={styles.row}>
          <Text style={styles.rowTxt}>Reportar un problema</Text>
        </Pressable>
        <Pressable onPress={logout} style={[styles.row, { backgroundColor: "#fee2e2" }]}>
          <Text style={[styles.rowTxt, { color: "#7f1d1d", fontWeight: "900" }]}>Cerrar sesión</Text>
        </Pressable>

        {Platform.OS === "ios" ? <View style={{ height: 12 }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  h1: { fontSize: 28, fontWeight: "900", color: C },
  sub: { marginTop: 2, color: "rgba(61,78,94,0.75)" },
  label: { color: C, fontWeight: "800", marginBottom: 6 },

  inputBox: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 14, backgroundColor: "#fff",
    paddingHorizontal: 12, paddingVertical: 10,
  },
  input: { color: C, fontSize: 16 },

  primary: {
    backgroundColor: BLUE, paddingVertical: 12, borderRadius: 14, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  primaryTxt: { color: "#fff", fontWeight: "900", fontSize: 16 },

  chip: { backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  chipTxt: { color: C, fontWeight: "800" },

  section: { marginTop: 18, marginBottom: 8, color: C, fontWeight: "800" },
  row: { backgroundColor: "#e6f3f8", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8 },
  rowTxt: { color: C, fontWeight: "800" },
});
