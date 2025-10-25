// app/+not-found.tsx (404 amigable)
// ====================================
import { Link } from "expo-router";
import { View, Text, Pressable } from "react-native";

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: "600", marginBottom: 8 }}>Ruta no encontrada</Text>
      <Text style={{ fontSize: 16, opacity: 0.7, textAlign: "center", marginBottom: 24 }}>
        Parece que esta pantalla no existe o se movió. Volvemos al mapa.
      </Text>
      <Link href="/(tabs)" asChild>
        <Pressable style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: "#E9EEF5" }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>Ir al mapa</Text>
        </Pressable>
      </Link>
    </View>
  );
}
