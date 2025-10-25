// components/TermsGate.tsx
import React from "react";
import { View, Text, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { router } from "expo-router";

type Props = {
  visible: boolean;
  onDismiss?: () => void;
};

export default function TermsGate({ visible, onDismiss }: Props) {
  if (!visible) return null;

  return (
    <View
      pointerEvents="auto"
      style={{
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        alignItems: "center",
        justifyContent: "center",
      } as any}
    >
      <BlurView intensity={40} tint="dark" style={{ ...StyleSheet.absoluteFillObject } as any} />
      <View
        style={{
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: 16,
          borderRadius: 12,
          maxWidth: 320,
          marginHorizontal: 24,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
          Acepta los Términos
        </Text>
        <Text style={{ color: "#fff", opacity: 0.85, marginBottom: 16 }}>
          Para usar el mapa y compartir ubicaciones, necesitas aceptar los Términos y la Política.
        </Text>
        <Pressable
          onPress={() => router.push("/legal/terms")}
          style={{
            backgroundColor: "#2f6bff",
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Ver y aceptar</Text>
        </Pressable>

        <Pressable
          onPress={onDismiss}
          style={{ alignItems: "center", marginTop: 12, paddingVertical: 6 }}
        >
          <Text style={{ color: "#fff", opacity: 0.8 }}>Más tarde</Text>
        </Pressable>
      </View>
    </View>
  );
}

const StyleSheet = {
  absoluteFillObject: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};
