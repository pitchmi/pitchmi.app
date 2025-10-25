// lib/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getBool(key: string) {
  try {
    const v = await AsyncStorage.getItem(key);
    return v === "true";
  } catch {
    return false;
  }
}

export async function setBool(key: string, value: boolean) {
  try {
    await AsyncStorage.setItem(key, value ? "true" : "false");
  } catch {}
}

// Solo para tests
export async function __clearAllForTests() {
  try {
    await AsyncStorage.clear();
  } catch {}
}
export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setJSON(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
