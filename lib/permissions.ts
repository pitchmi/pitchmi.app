// lib/permissions.ts — flujo robusto de permisos de localización
// ==============================================
import { Alert, Linking, Platform } from "react-native";
import * as Location from "expo-location";

export async function ensureLocationPermission(): Promise<boolean> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.status === "granted") return true;

    // iOS muestra rationale; Android depende del sistema
    const asked = await Location.requestForegroundPermissionsAsync();
    if (asked.status === "granted") return true;

    // Bloqueado o denegado: guiamos a Ajustes
    Alert.alert(
      "Permiso de localización",
      Platform.OS === "ios"
        ? "Activa la localización en Ajustes para centrar el mapa en tu posición."
        : "Activa la localización del dispositivo para centrar el mapa en tu posición.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  } catch (e) {
    console.log("ensureLocationPermission error", e);
    return false;
  }
}
