// lib/upload.ts
import { supabase } from "@/lib/supabase";

export async function uploadToPitches(uri: string, mime = "image/jpeg") {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("No autenticado");
  const path = `${auth.user.id}/${Date.now()}.jpg`;
  const blob = await (await fetch(uri)).blob();
  const { data, error } = await supabase.storage.from("pitches").upload(path, blob, {
    contentType: mime, upsert: true,
  });
  if (error) throw error;
  const { data: pub } = supabase.storage.from("pitches").getPublicUrl(data.path);
  return pub.publicUrl;
}
