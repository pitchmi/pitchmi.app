import { supabase } from "@/lib/supabase";

export type Pitch = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_urls: string[] | null;
  lat: number; lng: number;
  is_live: boolean | null;
  created_at: string;
};

export async function listPitches({ limit=20, from=0 }: { limit?: number; from?: number; }) {
  const { data, error } = await supabase
    .from("pitches").select("*").order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw error;
  return data as Pitch[];
}

export async function getPitch(id: string) {
  const { data, error } = await supabase.from("pitches").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Pitch;
}

export async function createPitch(input: Omit<Pitch,"id"|"user_id"|"created_at">) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data, error } = await supabase
    .from("pitches")
    .insert([{ ...input, user_id: user.id }])
    .select().single();
  if (error) throw error;
  return data as Pitch;
}

export async function toggleFavorite(pitch_id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: exists } = await supabase
    .from("favorites").select("pitch_id").eq("user_id", user.id).eq("pitch_id", pitch_id).maybeSingle();

  if (exists) {
    const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("pitch_id", pitch_id);
    if (error) throw error;
    return { saved: false };
  } else {
    const { error } = await supabase.from("favorites").insert([{ user_id: user.id, pitch_id }]);
    if (error) throw error;
    return { saved: true };
  }
}

export async function listFavorites() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data, error } = await supabase
    .from("favorites")
    .select("pitch_id, pitches(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r:any)=>r.pitches) as Pitch[];
}
export async function listPitchesPage({ cursor, limit=20 }:{ cursor?: string; limit?: number }) {
  const q = supabase.from("pitches").select("*").order("created_at", { ascending: false }).limit(limit);
  if (cursor) q.lt("created_at", cursor);
  const { data, error } = await q;
  if (error) throw error;
  const nextCursor = data?.length ? data[data.length-1].created_at : undefined;
  return { rows: data as Pitch[], nextCursor };
}
// +++ helpers de edición y borrado +++
export async function updatePitch(id: string, fields: Partial<{
  title: string;
  description: string | null;
  image_urls: string[] | null;
  image_url: string | null;   // compat
  lat: number; lng: number;
  is_live: boolean | null;
  category: string | null;    // si tu tabla la tiene
}>) {
  const { data, error } = await supabase
    .from("pitches")
    .update(fields)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Pitch;
}

export async function deletePitch(id: string) {
  const { error } = await supabase.from("pitches").delete().eq("id", id);
  if (error) throw error;
  return true;
}
