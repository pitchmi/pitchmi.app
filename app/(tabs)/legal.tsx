// app/(tabs)/legal.tsx
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { setConsent } from "@/lib/legal";
import * as Haptics from "expo-haptics";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function Legal() {
  const insets = useSafeAreaInsets();

  const goBack = () => router.back();

  const acceptAndClose = async () => {
    await setConsent(true);
    await Haptics.selectionAsync();
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header simple (si usas header del Stack, puedes quitar esto) */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#eee",
        }}
      >
        <Pressable onPress={goBack} style={{ padding: 8 }}>
          <Text style={{ fontWeight: "700" }}>← Volver</Text>
        </Pressable>
        <Text style={{ fontWeight: "800" }}>Términos y Privacidad</Text>
        <View style={{ width: 60 }} />{/* spacer */}
      </View>

      {/* Contenido scrollable con padding extra abajo para no cortar nada */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 22, fontWeight: "800" }}>Términos de uso</Text>
        <Text style={{ opacity: 0.85 }}>
          1. Pitchmi es una plataforma para publicar ubicaciones (“pitches”) y contenido asociado. Publica
          solo material que tengas derecho a compartir, y respeta las leyes y a terceros. Podemos moderar o
          retirar contenido que infrinja estos términos.
        </Text>
        <Text style={{ opacity: 0.85 }}>
          2. El servicio se ofrece “tal cual”. No garantizamos disponibilidad continua ni ausencia de errores.
          No nos hacemos responsables por pérdidas derivadas del uso de la app.
        </Text>
        <Text style={{ opacity: 0.85 }}>
          3. Podemos actualizar estos términos. Si el cambio es sustancial, te lo comunicaremos dentro de la app.
        </Text>

        <Text style={{ fontSize: 22, fontWeight: "800", marginTop: 8 }}>Política de privacidad</Text>
        <Text style={{ opacity: 0.85 }}>
          1. Datos tratados: cuenta (si te registras), ubicaciones y contenido que subes, identificadores
          técnicos y datos de uso. La ubicación se usa para centrar el mapa y mostrar contenido cercano.
        </Text>
        <Text style={{ opacity: 0.85 }}>
          2. Finalidades: funcionamiento del servicio, seguridad, métricas internas y mejora de la app.
        </Text>
        <Text style={{ opacity: 0.85 }}>
          3. Conservación: mientras mantengas tu cuenta y según obligaciones legales. Puedes solicitar la
          eliminación de tu cuenta y datos desde soporte.
        </Text>
        <Text style={{ opacity: 0.85 }}>
          4. Terceros: usamos proveedores de infraestructura (p. ej. Supabase) para hosting y almacenamiento.
          Ellos procesan datos en nuestro nombre.
        </Text>
        <Text style={{ opacity: 0.85 }}>
          5. Tus derechos: acceso, rectificación, eliminación y portabilidad, cuando aplique. Contacto:
          admin@pitchmi.app
        </Text>

        <View style={{ height: 24 }} />
        <Text style={{ opacity: 0.6, fontSize: 12 }}>
          Última actualización: {new Date().toISOString().slice(0, 10)}
        </Text>
      </ScrollView>

      {/* Footer fijo con safe-area */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: insets.bottom + 10,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#eee",
          flexDirection: "row",
          gap: 10,
        }}
      >
        <Pressable
          onPress={goBack}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#ddd",
            alignItems: "center",
          }}
        >
          <Text>Cancelar</Text>
        </Pressable>

        <Pressable
          onPress={acceptAndClose}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: "#2f6bff",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>Aceptar y continuar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
