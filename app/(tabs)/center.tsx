// app/(tabs)/center.tsx — tab "Centrar" que rebota al mapa con acción
// ===============================
import { useRouter } from "expo-router";
import { useEffect } from "react";
export default function CenterTab() {
  const r = useRouter();
  useEffect(() => {
    r.replace({ pathname: "/(tabs)", params: { action: "center" } });
  }, []);
  return null;
}
