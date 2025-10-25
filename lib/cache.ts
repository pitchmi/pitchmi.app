import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Pitch } from "@/types/pitch";

const KEY = "pitches:cache";

export async function savePitchesCache(rows: Pitch[]) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(rows));
  } catch {}
}

export async function loadPitchesCache(): Promise<Pitch[] | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Pitch[]) : null;
  } catch {
    return null;
  }
}

export async function clearPitchesCache() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
