// lib/images.ts
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

export type PickedImage = { uri: string; width: number; height: number };

export async function pickFromLibrary(multiple = true) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") throw new Error("Permiso de galería denegado.");
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
    allowsMultipleSelection: multiple && Platform.OS !== "android" ? true : undefined,
    selectionLimit: multiple && Platform.OS !== "android" ? 6 : 1,
  });
  if (res.canceled) return [];
  const assets = (res as any).assets ?? [res];
  return assets.map((a: any) => ({ uri: a.uri, width: a.width, height: a.height })) as PickedImage[];
}

export async function takePhoto() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") throw new Error("Permiso de cámara denegado.");
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });
  if (res.canceled) return null;
  const a = (res as any).assets?.[0] ?? res;
  return { uri: a.uri, width: a.width, height: a.height } as PickedImage;
}

async function compress(uri: string) {
  const out = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return out.uri;
}

function rnd() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Corregido: usar arrayBuffer() en lugar de blob()
export async function uploadToSupabase(uri: string, userId: string) {
  const jpg = await compress(uri);
  const res = await fetch(jpg);
  const arrayBuffer = await res.arrayBuffer();

  const path = `${userId}/${rnd()}.jpg`;
  const { error } = await supabase.storage.from("pitches").upload(path, arrayBuffer, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("pitches").getPublicUrl(path);
  return data.publicUrl as string;
}
