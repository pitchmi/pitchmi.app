// lib/prefetch.ts
import { fetchPitches } from "@/lib/pitches";
import { savePitchesCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

export async function prefetchHomeData(): Promise<void> {
  try {
    const rows = await fetchPitches();
    await savePitchesCache(rows);
    logger.info("prefetch:pitches:ok", { count: rows.length });
  } catch (e) {
    logger.warn("prefetch:pitches:fail", { err: String(e) });
  }
}
