// lib/pitches.ts
import { supabase } from "@/lib/supabase";
import type { Pitch } from "@/types/pitch";

export async function fetchPitches(_category: string | null, q: string, page: number, pageSize: number) {
  let query = supabase.from("pitches").select("*").order("created_at", { ascending: false });
  if (q?.trim()) {
    const s = q.trim();
    query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
  }
  if (pageSize) query = query.range(page * pageSize, page * pageSize + pageSize - 1);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Pitch[];
}

export async function getPitchById(id: string) {
  const { data, error } = await supabase.from("pitches").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Pitch | null;
}

type NewPitchInput = {
  user_id: string;
  title: string;
  description?: string | null;
  lat: number;
  lng: number;
  image_urls?: string[] | null;
  image_url?: string | null;
  live_start_at?: string | null;
  live_end_at?: string | null;
  category?: Pitch["category"];
};

export async function createPitch(input: NewPitchInput) {
  const { data, error } = await supabase.from("pitches").insert([input]).select().single();
  if (error) throw error;
  return data as Pitch;
}

export async function updatePitch(id: string, patch: Partial<NewPitchInput>) {
  const { data, error } = await supabase.from("pitches").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Pitch;
}

export type SearchResult = {
  id: string;
  title: string;
  description: string | null;
  lat: number;
  lng: number;
  image_url?: string | null;
  image_urls?: string[] | null;
  live_start_at?: string | null;
  live_end_at?: string | null;
  category?: Pitch["category"];
};

export async function searchPitches(q: string, limit = 8): Promise<SearchResult[]> {
  const s = (q ?? "").trim();
  if (!s) return [];
  const { data, error } = await supabase
    .from("pitches")
    .select("id,title,description,lat,lng,image_url,image_urls,live_start_at,live_end_at,category")
    .or(`title.ilike.%${s}%,description.ilike.%${s}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SearchResult[];
}
