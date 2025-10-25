// app/(tabs)/refresh.tsx — tab "Actualizar" que rebota al mapa con acción
// ===============================
import { useRouter } from "expo-router";
import { useEffect } from "react";
export default function RefreshTab() {
  const r = useRouter();
  useEffect(() => {
    r.replace({ pathname: "/(tabs)", params: { action: "refresh" } });
  }, []);
  return null;
}
