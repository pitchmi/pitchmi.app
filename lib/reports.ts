// lib/reports.ts — crear un reporte simple
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export async function reportPitch(pitchId: string, reason: string = "inappropriate") {
  try {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    await supabase.from("reports").insert({
      pitch_id: pitchId,
      reason,
      // puedes añadir user_id si tu sesión lo expone
    });
    logger.info("report:created", { pitchId, reason });
  } catch (e) {
    logger.warn("report:failed", { error: String(e), pitchId });
    throw e;
  }
}
