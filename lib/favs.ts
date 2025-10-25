// lib/favs.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

const KEY = "fav_ids_v1";

// helpers locales
async function readFavs(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function writeFavs(ids: string[]) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
}

// --- SUPABASE ---
async function cloudList(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_favs")
    .select("pitch_id")
    .eq("user_id", userId);
  if (error) throw error;
  return data.map((r) => r.pitch_id);
}

async function cloudIsFav(pitchId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_favs")
    .select("pitch_id")
    .eq("user_id", userId)
    .eq("pitch_id", pitchId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

async function cloudToggle(pitchId: string, userId: string): Promise<boolean> {
  const liked = await cloudIsFav(pitchId, userId);
  if (liked) {
    const { error } = await supabase
      .from("user_favs")
      .delete()
      .eq("user_id", userId)
      .eq("pitch_id", pitchId);
    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from("user_favs")
      .insert({ user_id: userId, pitch_id: pitchId });
    if (error) throw error;
    return true;
  }
}

// --- API pública ---

export async function isFav(pitchId: string, userId?: string): Promise<boolean> {
  if (userId) {
    try {
      return await cloudIsFav(pitchId, userId);
    } catch {
      // fallback local
    }
  }
  return await readFavs().then((a) => a.includes(pitchId));
}

export async function toggleFav(pitchId: string, userId?: string): Promise<boolean> {
  if (userId) {
    try {
      return await cloudToggle(pitchId, userId);
    } catch {
      // fallback local
    }
  }

  const current = await readFavs();
  const has = current.includes(pitchId);
  const next = has ? current.filter((id) => id !== pitchId) : [...current, pitchId];
  await writeFavs(next);
  return !has;
}
