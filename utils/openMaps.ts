import * as Linking from "expo-linking";
export function openMaps(lat:number,lng:number,label="Destino") {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(label)}`;
  Linking.openURL(url);
}
