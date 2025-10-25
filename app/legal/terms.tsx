// app/(legal)/terms.tsx
import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { setBool } from "@/lib/storage";
import { TERMS_KEY } from "@/lib/constants";
import { router } from "expo-router";

export default function TermsScreen() {
  const [saving, setSaving] = useState(false);

  const onAccept = async () => {
    try {
      setSaving(true);
      await setBool(TERMS_KEY, true);
      router.replace("/(tabs)");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFillObject} />
      <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
        <View
          style={{
            backgroundColor: "#ffffffF2",
            borderRadius: 18,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 22,
            elevation: 6,
          }}
        >
          <View
            style={{
              paddingTop: 18,
              paddingHorizontal: 18,
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderColor: "#eef2f5",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700" }}>Términos y privacidad</Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 18, maxHeight: 480 }}>
            <Text style={{ fontSize: 16, lineHeight: 22, color: "#3d4e5e", marginBottom: 16 }}>
              Aquí va tu documento completo de términos y política. Reemplaza este texto por el
              definitivo.
            </Text>
            {/* …contenido… */}
          </ScrollView>

          <View style={{ padding: 18, borderTopWidth: 1, borderColor: "#eef2f5" }}>
            <Pressable
              onPress={onAccept}
              disabled={saving}
              style={{
                backgroundColor: saving ? "#dbe3ea" : "#3d4e5e",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {saving ? "Guardando..." : "Acepto"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
