// app/(modals)/new-pitch.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert, Pressable, ScrollView, Text, TextInput, View, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";

import { useToast } from "@/components/Toast";
import { CATEGORY_COLORS, type CategoryKey } from "@/lib/categories";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

type Photo = { uri: string };

const C = "#3d4e5e";
const BLUE = "#2F6BFF";
const BG = "#f9fcfd";
const BORDER = "#e8eef3";
const SHADOW = { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 };

const fmtDT = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});

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

async function uploadPhoto(uri: string, userId: string) {
  const b64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
  const bytes = base64ToBytes(b64);
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage.from("pitches").upload(path, bytes.buffer, {
    contentType: "image/jpeg", upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("pitches").getPublicUrl(path);
  return data.publicUrl;
}

export default function NewPitch() {
  const { session, ready } = useSession();
  const toast = useToast();
  const mapRef = useRef<MapView>(null);

  // ubicación
  const [region, setRegion] = useState<Region | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);

  // formulario
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [category, setCategory] = useState<CategoryKey | null>(null);

  // LIVE
  const [startAt, setStartAt] = useState<Date | null>(null);
  const [endAt, setEndAt] = useState<Date | null>(null);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  // envío
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setRegion({ latitude: 41.3874, longitude: 2.1686, latitudeDelta: 0.08, longitudeDelta: 0.08 });
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const next: Region = {
          latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08,
        };
        setRegion(next);
        setPin({ lat: next.latitude, lng: next.longitude });
      } catch {
        setRegion({ latitude: 41.3874, longitude: 2.1686, latitudeDelta: 0.08, longitudeDelta: 0.08 });
      }
    })();
  }, []);

  const centerOnMe = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permiso denegado", "Activa la localización para usar tu ubicación."); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const next: Region = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
      mapRef.current?.animateToRegion(next, 350);
      setRegion(next);
      setPin({ lat: next.latitude, lng: next.longitude });
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo obtener tu ubicación.");
    }
  }, []);

  const onMapPress = useCallback((e: any) => {
    const { coordinate } = e.nativeEvent;
    setPin({ lat: coordinate.latitude, lng: coordinate.longitude });
  }, []);

  // fotos
  const removePhoto = useCallback((idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addFromLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permiso denegado", "Autoriza la galería para añadir fotos."); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      selectionLimit: 6, allowsMultipleSelection: true, quality: 0.82,
    });
    if ((res as any).canceled) return;
    const picked = ("assets" in res ? res.assets : []).map((a) => ({ uri: a.uri }));
    setPhotos((prev) => [...prev, ...picked].slice(0, 10));
  }, []);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permiso denegado", "Autoriza la cámara para tomar fotos."); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.82 });
    if ((res as any).canceled) return;
    const a = (res as any).assets?.[0];
    if (a?.uri) setPhotos((prev) => [...prev, { uri: a.uri }]);
  }, []);

  // publicar
  const publish = useCallback(async () => {
    if (!session?.user?.id) { router.replace("/auth"); return; }
    if (!pin) return Alert.alert("Falta ubicación", "Coloca el pin en el mapa.");
    if (!title.trim()) return Alert.alert("Falta título", "Añade un título.");
    if ((startAt && !endAt) || (!startAt && endAt)) return Alert.alert("LIVE incompleto", "Define inicio y fin.");
    if (startAt && endAt && endAt <= startAt) return Alert.alert("Rango inválido", "El fin debe ser posterior al inicio.");

    try {
      setSubmitting(true);
      const userId = session.user.id;

      const image_urls: string[] = [];
      for (const p of photos) image_urls.push(await uploadPhoto(p.uri, userId));

      const { error } = await supabase.from("pitches").insert([{
        user_id: userId, title: title.trim(), description: description.trim() || null,
        lat: pin.lat, lng: pin.lng, image_urls, category,
        live_start_at: startAt ? startAt.toISOString() : null,
        live_end_at: endAt ? endAt.toISOString() : null,
      }]);
      if (error) throw error;

      toast.show("Publicado");
      router.back();
    } catch (e: any) {
      Alert.alert("Error al publicar", e?.message ?? "Revisa RLS, tabla y bucket 'pitches'.");
    } finally {
      setSubmitting(false);
    }
  }, [session, pin, title, description, photos, category, startAt, endAt, toast]);

  // chips categoría
  const CategoryChip = ({ k }: { k: CategoryKey }) => {
    const selected = category === k;
    const color = CATEGORY_COLORS[k];
    return (
      <Pressable
        onPress={() => setCategory(selected ? null : k)}
        style={{
          flexDirection: "row", alignItems: "center", gap: 8,
          paddingHorizontal: 12, height: 36, borderRadius: 18,
          backgroundColor: "#fff", borderWidth: 1,
          borderColor: selected ? color : BORDER, ...SHADOW,
        }}
      >
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, borderWidth: 1, borderColor: "#fff" }} />
        <Text style={{ color: C, fontWeight: "700", textTransform: "capitalize", fontSize: 13 }}>{k}</Text>
      </Pressable>
    );
  };

  const categories = Object.keys(CATEGORY_COLORS) as CategoryKey[];

  // gate UI
  if (ready && !session) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: BG }}>
        <StatusBar style="dark" />
        <Text style={{ fontSize: 18, fontWeight: "800", color: C, textAlign: "center" }}>
          Necesitas una cuenta para publicar
        </Text>
        <Pressable
          onPress={() => router.replace("/auth")}
          style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: BLUE }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>Entrar / Registrar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Título */}
        <Text style={{ fontSize: 34, fontWeight: "900", color: C }}>Nuevo pitch</Text>
        <Text style={{ marginTop: 4, color: "rgba(61,78,94,0.75)", fontSize: 14 }}>
          Coloca el pin, añade fotos y completa los datos.
        </Text>

        {/* Mapa */}
        <View style={{ marginTop: 16, borderRadius: 18, overflow: "hidden", backgroundColor: "#e5e7eb", height: 240, ...SHADOW }}>
          {region && (
            <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={region} onPress={onMapPress} showsUserLocation>
              {pin && <Marker coordinate={{ latitude: pin.lat, longitude: pin.lng }} />}
            </MapView>
          )}
          <Pressable
            onPress={centerOnMe}
            style={{
              position: "absolute", right: 12, bottom: 12,
              paddingHorizontal: 14, height: 38, borderRadius: 12,
              alignItems: "center", justifyContent: "center",
              backgroundColor: "#ffffff", borderWidth: 1, borderColor: BORDER, ...SHADOW,
            }}
          >
            <Text style={{ fontWeight: "800", color: C }}>Usar mi ubicación</Text>
          </Pressable>
        </View>

        {/* Fotos */}
        <Text style={{ marginTop: 18, marginBottom: 8, fontSize: 16, fontWeight: "800", color: C }}>Fotos</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={addFromLibrary} style={{ flex: 1, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, ...SHADOW }}>
            <Text style={{ fontWeight: "800", color: C, fontSize: 14 }}>Añadir de galería</Text>
          </Pressable>
          <Pressable onPress={takePhoto} style={{ flex: 1, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, ...SHADOW }}>
            <Text style={{ fontWeight: "800", color: C, fontSize: 14 }}>Tomar foto</Text>
          </Pressable>
        </View>

        {photos.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            {photos.map((p, i) => (
              <View key={p.uri + i} style={{ width: 96, height: 96 }}>
                <Image source={{ uri: p.uri }} style={{ width: 96, height: 96, borderRadius: 10, backgroundColor: "#e5e7eb" }} contentFit="cover" />
                <Pressable
                  onPress={() => removePhoto(i)}
                  hitSlop={8}
                  style={{
                    position: "absolute", top: -8, right: -8,
                    width: 24, height: 24, borderRadius: 12,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.7)",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Campos */}
        <Text style={{ marginTop: 18, marginBottom: 8, fontSize: 16, fontWeight: "800", color: C }}>Título</Text>
        <View style={{ height: 48, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, justifyContent: "center", ...SHADOW }}>
          <TextInput placeholder="Ej. Concierto al atardecer" placeholderTextColor="#9CA3AF" value={title} onChangeText={setTitle} style={{ fontSize: 16, color: C }} />
        </View>

        <Text style={{ marginTop: 18, marginBottom: 8, fontSize: 16, fontWeight: "800", color: C }}>Descripción</Text>
        <View style={{ borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 10, minHeight: 120, ...SHADOW }}>
          <TextInput
            placeholder="Detalles útiles..." placeholderTextColor="#9CA3AF"
            value={description} onChangeText={setDescription} multiline
            style={{ fontSize: 16, color: C, minHeight: 100, textAlignVertical: "top" }}
          />
        </View>

        {/* Categoría */}
        <Text style={{ marginTop: 18, marginBottom: 8, fontSize: 16, fontWeight: "800", color: C }}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {(Object.keys(CATEGORY_COLORS) as CategoryKey[]).map((k) => (<CategoryChip key={k} k={k} />))}
        </ScrollView>

        {/* LIVE */}
        <Text style={{ marginTop: 18, marginBottom: 8, fontSize: 16, fontWeight: "800", color: C }}>LIVE</Text>
        <View style={{ gap: 8 }}>
          <Pressable
            onPress={() => setShowStart(true)}
            style={{ height: 44, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, justifyContent: "center", ...SHADOW }}
          >
            <Text style={{ color: startAt ? C : "rgba(61,78,94,0.7)", fontWeight: "800", fontSize: 14 }}>
              {startAt ? `Inicio: ${fmtDT.format(startAt)}` : "Definir fecha y hora de inicio"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowEnd(true)}
            style={{ height: 44, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, justifyContent: "center", ...SHADOW }}
          >
            <Text style={{ color: endAt ? C : "rgba(61,78,94,0.7)", fontWeight: "800", fontSize: 14 }}>
              {endAt ? `Fin: ${fmtDT.format(endAt)}` : "Definir fecha y hora de fin"}
            </Text>
          </Pressable>
        </View>

        {showStart && (
          <DateTimePicker
            value={startAt ?? new Date()}
            mode="datetime"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            locale={Platform.OS === "ios" ? "es-ES" : undefined}
            onChange={(_, d) => { setShowStart(false); if (d) setStartAt(d); }}
          />
        )}
        {showEnd && (
          <DateTimePicker
            value={endAt ?? (startAt ? new Date(startAt.getTime() + 60 * 60 * 1000) : new Date())}
            mode="datetime"
            minimumDate={startAt ?? undefined}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            locale={Platform.OS === "ios" ? "es-ES" : undefined}
            onChange={(_, d) => { setShowEnd(false); if (d) setEndAt(d); }}
          />
        )}

        {/* CTA */}
        <Pressable
          onPress={publish}
          disabled={submitting}
          style={{
            opacity: submitting ? 0.6 : 1, marginTop: 18, height: 54, borderRadius: 14,
            alignItems: "center", justifyContent: "center", backgroundColor: BLUE, ...SHADOW,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
            {submitting ? "Publicando..." : "Publicar"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={{ marginTop: 14, alignItems: "center", paddingVertical: 6 }}>
          <Text style={{ color: C, fontWeight: "800", fontSize: 16 }}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
