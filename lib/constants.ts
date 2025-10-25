// lib/constants.ts (claves y versiones)
// ==================================================================
// 🔁 Re-aceptación legal: sube TERMS_VERSION para forzar el modal de nuevo
export const TERMS_VERSION = 2; // << súbelo cuando cambien los términos
export const TERMS_KEY = `termsAccepted@v${TERMS_VERSION}`;

// ==================================================================
// lib/storage.ts (helper único para AsyncStorage)
// ==================================================================
// ⚠️ Importa AsyncStorage **solo aquí** y no en más archivos de la app.
import AsyncStorage from "@react-native-async-storage/async-storage"; // <- ÚNICO import real

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

// ⚙️ Utilidad de testeo (no usar en runtime de la app)
export async function __clearAllForTests() {
  try { await AsyncStorage.clear(); } catch {}
}
