// lib/portfolios.ts
import { supabase } from "@/lib/supabase";

export type Portfolio = {
  id: string;
  owner_id: string;
  title: string;
  summary: string | null;
  cover_images: string[] | null;
  city: string | null;
  start_date: string | null; // YYYY-MM-DD
  end_date: string | null;
  is_public: boolean;
  diary: string | null;
  created_at: string;
  updated_at: string;
};

export type PortfolioItem = {
  id: string;
  portfolio_id: string;
  pitch_id: string | null;
  title: string | null;
  note: string | null;
  day_index: number; // 0 = start_date
  start_time: string | null; // "09:00"
  end_time: string | null;   // "10:30"
  order_index: number;
  image_urls: string[] | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

const PAGE = 12;

export async function fetchDiscover(page: number) {
  const from = page * PAGE, to = from + PAGE - 1;
  const { data, error } = await supabase
    .from("portfolios").select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return (data as Portfolio[]) ?? [];
}

export async function fetchOwner(ownerId: string, page: number) {
  const from = page * PAGE, to = from + PAGE - 1;
  const { data, error } = await supabase
    .from("portfolios").select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return (data as Portfolio[]) ?? [];
}

export async function fetchSavedPortfolios(userId: string, page: number) {
  const from = page * PAGE, to = from + PAGE - 1;
  const { data: saves, error: e1 } = await supabase
    .from("saved_portfolios")
    .select("portfolio_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (e1) throw e1;
  const ids = (saves ?? []).map((s: any) => s.portfolio_id);
  if (!ids.length) return [];
  const { data, error: e2 } = await supabase
    .from("portfolios").select("*").in("id", ids);
  if (e2) throw e2;
  const byId = new Map((data as Portfolio[]).map((p) => [p.id, p]));
  return ids.map((id: string) => byId.get(id)).filter(Boolean) as Portfolio[];
}

export async function fetchPortfolio(id: string) {
  const { data, error } = await supabase
    .from("portfolios").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Portfolio;
}

export async function fetchPortfolioItems(id: string) {
  const { data, error } = await supabase
    .from("portfolio_items").select("*")
    .eq("portfolio_id", id)
    .order("day_index", { ascending: true })
    .order("start_time", { ascending: true })
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data as PortfolioItem[]) ?? [];
}

export async function upsertPortfolio(patch: Partial<Portfolio> & { id: string }) {
  const { data, error } = await supabase
    .from("portfolios").update(patch).eq("id", patch.id)
    .select().single();
  if (error) throw error;
  return data as Portfolio;
}

export async function createBlock(input: {
  portfolio_id: string; day_index: number; title?: string; note?: string; image_urls?: string[] | null; pitch_id?: string | null;
}) {
  const { data, error } = await supabase
    .from("portfolio_items")
    .insert({
      portfolio_id: input.portfolio_id,
      day_index: input.day_index,
      title: input.title ?? "Nuevo bloque",
      note: input.note ?? "",
      order_index: Date.now(),
      image_urls: input.image_urls ?? null,
      pitch_id: input.pitch_id ?? null,
    }).select().single();
  if (error) throw error;
  return data as PortfolioItem;
}

/* ---------- util calendario ---------- */
export function dayToDateStr(start?: string | null, day = 0) {
  const base = start ? new Date(start + "T00:00:00") : new Date();
  const d = new Date(base.getTime());
  d.setDate(base.getDate() + day);
  return d.toISOString().slice(0, 10);
}
export function dateStrToDay(start?: string | null, ymd?: string) {
  if (!ymd) return 0;
  const a = new Date((start ?? dayToDateStr(undefined, 0)) + "T00:00:00");
  const b = new Date(ymd + "T00:00:00");
  return Math.round((+b - +a) / (1000 * 60 * 60 * 24));
}

