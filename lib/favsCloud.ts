// lib/favsCloud.ts
import { supabase } from "@/lib/supabase";

export async function listFavIdsCloud(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_favs")
    .select("pitch_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.pitch_id);
}

export async function isFavCloud(pitchId: string, userId: string) {
  const { data, error } = await supabase
    .from("user_favs")
    .select("pitch_id")
    .eq("user_id", userId)
    .eq("pitch_id", pitchId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function toggleFavCloud(pitchId: string, userId: string) {
  // si existe → borrar, si no → insertar
  const exists = await isFavCloud(pitchId, userId);
  if (exists) {
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
