// lib/legal.ts
import * as SecureStore from "expo-secure-store";

const KEY = "legal:consent:v1";

export async function hasConsent(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(KEY);
    return v === "1";
  } catch {
    return false;
  }
}

export async function setConsent(accepted: boolean): Promise<void> {
  try {
    if (accepted) await SecureStore.setItemAsync(KEY, "1");
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // no-op
  }
}
