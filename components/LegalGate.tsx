// components/LegalGate.tsx
import React, { useEffect, useRef, useState, ReactNode } from "react";
import { Modal, View, Text, TouchableOpacity, Animated, Platform, Linking } from "react-native";
import { BlurView } from "expo-blur";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import { StyleSheet } from "react-native";


const STORAGE_KEY = "pm.acceptedTerms.v1";

interface Props {
  children?: ReactNode;
}

export default function LegalGate({ children }: Props) {
  const [checking, setChecking] = useState(true);
  const [show, setShow] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEY);
        const shouldShow = !value;
        setShow(shouldShow);
        if (shouldShow) {
          Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
        }
      } finally {
        setChecking(false);
      }
    })();
  }, [opacity]);

  const accept = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "true");
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setShow(false);
    });
  };

  if (checking) return null;

  return (
    <>
      {children}

      <Modal visible={show} transparent animationType="none">
        <Animated.View style={{ flex: 1, opacity }}>
          {/* capa oscura + blur */}
          <View style={{ ...StyleSheet.absoluteFillObject } as any}>
            <BlurView intensity={30} tint="dark" style={{ flex: 1 }} />
          </View>

          <View style={{ flex: 1, justifyContent: "center", padding: 18 }}>
            <View
              style={{
                borderRadius: 20,
                padding: 18,
                backgroundColor: "#FFFFFF",
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 6 }}>
                Términos y privacidad
              </Text>

              <Text style={{ color: "#475569", lineHeight: 20, marginBottom: 12 }}>
                Para usar Pitchmi debes aceptar los Términos y la Política de privacidad. Tu elección
                queda guardada en el dispositivo y no se mostrará de nuevo.
              </Text>

              <View style={{ gap: 10, marginBottom: 8 }}>
                <Link href="/legal/terms" asChild>
                  <TouchableOpacity style={{ paddingVertical: 10 }}>
                    <Text style={{ color: "#2563EB", fontWeight: "700" }}>Ver Términos de servicio</Text>
                  </TouchableOpacity>
                </Link>

                <Link href="/legal/privacy" asChild>
                  <TouchableOpacity style={{ paddingVertical: 10 }}>
                    <Text style={{ color: "#2563EB", fontWeight: "700" }}>Ver Política de privacidad</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={accept}
                  activeOpacity={0.9}
                  style={{
                    flex: 1,
                    backgroundColor: "#4F46E5", // violeta pitchmi
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "800" }}>Aceptar y continuar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const url = "mailto:hello@pitchmi.app";
                    if (Platform.OS === "ios" || Platform.OS === "android") Linking.openURL(url).catch(() => {});
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  <Text style={{ color: "#334155", fontWeight: "700" }}>Dudas</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 8 }}>
                Puedes revisar los documentos desde Ajustes → Legal en cualquier momento.
              </Text>
            </View>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}
