// lib/profiles.ts
import { supabase } from "./supabase";

export type Profile = {
  id: string;            // auth.users.id
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at?: string;
};

export async function getProfile(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,avatar_url,bio,created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Profile | null;
}

export async function upsertMyProfile(patch: Partial<Profile> & { id: string }) {
  const { error } = await supabase
    .from("profiles")
    .upsert(patch, { onConflict: "id" });
  if (error) throw error;
}

export async function listUserPitches(userId: string, limit = 12) {
  const { data, error } = await supabase
    .from("pitches")
    .select("id,title,description,image_urls,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
