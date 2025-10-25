// lib/pitchesMutations.ts — CRUD sobre Supabase con mismas garantías que fetchPitches
import type { Pitch } from "@/types/pitch";
import { logger } from "@/lib/logger";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Reutiliza el singleton de tu lib/supabase.ts si lo prefieres.
// Aquí hago un mini-getClient local para que sea plug&play.
let _client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  _client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return _client;
}

// Helpers de resiliencia
type RetryOpts = { retries?: number; timeoutMs?: number; baseDelayMs?: number };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => {
      clearTimeout(id);
      resolve(v);
    }).catch((e) => {
      clearTimeout(id);
      reject(e);
    });
  });
const isRetriable = (e: unknown) => /timeout|network|fetch|aborted|503|429/i.test(String(e ?? ""));

async function retrying<T>(fn: () => Promise<T>, { retries = 2, timeoutMs = 8000, baseDelayMs = 300 }: RetryOpts = {}) {
  let attempt = 0, lastErr: any;
  while (attempt <= retries) {
    try {
      return await withTimeout(fn(), timeoutMs);
    } catch (e) {
      lastErr = e;
      if (attempt === retries || !isRetriable(e)) break;
      const backoff = Math.min(baseDelayMs * 2 ** attempt, 10_000);
      logger.warn("supabase:mutation:retry", { attempt, backoff, error: String(e) });
      await sleep(backoff);
      attempt++;
    }
  }
  logger.error("supabase:mutation:failed", { error: String(lastErr) });
  throw lastErr ?? new Error("Mutation failed");
}

// ======= API =======

export async function fetchPitches(): Promise<Pitch[]> {
  // Reexport conveniente para el hook
  const c = getClient();
  const exec = async () => {
    const { data, error, status } = await c
      .from("pitches")
      .select("id,title,lat,lng,user_id,image_url,description")
      .order("updated_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(`HTTP ${status} - ${error.message}`);
    return (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      lat: Number(row.lat),
      lng: Number(row.lng),
      user_id: row.user_id ?? null,
      image_url: row.image_url ?? null,
      description: row.description ?? null,
    })) as Pitch[];
  };
  return retrying(exec);
}

export async function createPitch(input: Omit<Pitch, "id">): Promise<Pitch> {
  const c = getClient();
  const exec = async () => {
    const { data, error, status } = await c
      .from("pitches")
      .insert({
        title: input.title,
        lat: input.lat,
        lng: input.lng,
        user_id: (input as any).user_id ?? null,
        image_url: input.image_url ?? null,
        description: input.description ?? null,
      })
      .select("id,title,lat,lng,user_id,image_url,description")
      .single();
    if (error) throw new Error(`HTTP ${status} - ${error.message}`);
    return {
      id: data!.id,
      title: data!.title,
      lat: Number(data!.lat),
      lng: Number(data!.lng),
      user_id: data!.user_id ?? null,
      image_url: data!.image_url ?? null,
      description: data!.description ?? null,
    } as Pitch;
  };
  const t0 = Date.now();
  const res = await retrying(exec);
  logger.info("pitch:create", { ms: Date.now() - t0, id: res.id });
  return res;
}

export async function updatePitch(id: string, patch: Partial<Pitch>): Promise<Pitch> {
  const c = getClient();
  const exec = async () => {
    const { data, error, status } = await c
      .from("pitches")
      .update({
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.lat !== undefined ? { lat: patch.lat } : {}),
        ...(patch.lng !== undefined ? { lng: patch.lng } : {}),
        ...(patch.image_url !== undefined ? { image_url: patch.image_url } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
      })
      .eq("id", id)
      .select("id,title,lat,lng,user_id,image_url,description")
      .single();
    if (error) throw new Error(`HTTP ${status} - ${error.message}`);
    return {
      id: data!.id,
      title: data!.title,
      lat: Number(data!.lat),
      lng: Number(data!.lng),
      user_id: data!.user_id ?? null,
      image_url: data!.image_url ?? null,
      description: data!.description ?? null,
    } as Pitch;
  };
  const t0 = Date.now();
  const res = await retrying(exec);
  logger.info("pitch:update", { ms: Date.now() - t0, id });
  return res;
}

export async function deletePitch(id: string): Promise<void> {
  const c = getClient();
  const exec = async () => {
    const { error, status } = await c.from("pitches").delete().eq("id", id);
    if (error) throw new Error(`HTTP ${status} - ${error.message}`);
  };
  const t0 = Date.now();
  await retrying(exec);
  logger.info("pitch:delete", { ms: Date.now() - t0, id });
}
