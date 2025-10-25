import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const params = useLocalSearchParams();

  useEffect(() => {
    // Supabase maneja el intercambio de tokens automáticamente con el deep link.
    // Aquí simplemente volvemos donde estábamos.
    const timer = setTimeout(() => {
      router.replace("/"); // a tu índice/tab raíz
    }, 400);
    return () => clearTimeout(timer);
  }, [params]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
