// app/(tabs)/radio.tsx — tab "Radio" que rebota al mapa con acción
// ===============================
import { useRouter } from "expo-router";
import { useEffect } from "react";
export default function RadioTab() {
  const r = useRouter();
  useEffect(() => {
    r.replace({ pathname: "/(tabs)", params: { action: "radius" } });
  }, []);
  return null;
}
