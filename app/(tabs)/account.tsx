// app/(tabs)/account.tsx — Pestaña de cuenta: si hay sesión → perfil, si no → CTA login/registro
// ===============================
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useSession } from "@/lib/session";
import { View, Text, Pressable } from "react-native";

export default function AccountTab() {
  const { user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/edit-profile");
  }, [user]);

  if (user) return <View style={{ flex: 1, backgroundColor: "#f9fcfd" }} />;

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fcfd", padding: 16, justifyContent: "center" }}>
      <Text style={{ color: "#3d4e5e", fontWeight: "900", fontSize: 20, marginBottom: 12 }}>
        Entra o crea tu cuenta
      </Text>
      <Pressable
        onPress={() => router.push("/(modals)/auth")}
        style={{ paddingVertical: 14, borderRadius: 12, backgroundColor: "#2f6bff", alignItems: "center" }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>Entrar / Registrar</Text>
      </Pressable>
    </View>
  );
}
