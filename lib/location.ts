// lib/location.ts
import * as Location from "expo-location";

export async function getLocationSafe() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("Permiso de ubicación denegado");
  const last = await Location.getLastKnownPositionAsync();
  if (last) {
    return { lat: last.coords.latitude, lng: last.coords.longitude };
  }
  const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: cur.coords.latitude, lng: cur.coords.longitude };
}
