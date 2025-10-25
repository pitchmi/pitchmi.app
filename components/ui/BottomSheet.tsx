// components/ui/BottomSheet.tsx
import React, { useEffect, useRef } from "react";
import {
  Modal, View, Text, Image, Pressable, Animated, Linking, Platform, ScrollView,
} from "react-native";
import { router } from "expo-router";

const C = "#3d4e5e";

export type PitchPreview = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  lat: number;
  lng: number;
  live_start_at: string | null;
  live_end_at: string | null;
};

function openMaps(lat: number, lng: number, name: string) {
  const q = encodeURIComponent(name);
  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?ll=${lat},${lng}&q=${q}`
      : `geo:${lat},${lng}?q=${q}`;
  Linking.openURL(url).catch(() => {});
}

const MAX_LINES = 5;

export default function BottomSheet({
  visible,
  data,
  onClose,
}: {
  visible: boolean;
  data: PitchPreview | null;
  onClose: () => void;
}) {
  const y = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(y, {
      toValue: visible ? 0 : 300,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, y]);

  const goToPost = () => {
    if (!data) return;
    router.push({ pathname: "/portafolio", params: { id: data.id } });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.12)" }}>
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateY: y }],
          }}
        >
          {/* Card blanca con márgenes */}
          <View
            style={{
              paddingTop: 12,
              paddingBottom: 10,
              paddingHorizontal: 10,
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 44,
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(0,0,0,0.2)",
                marginBottom: 10,
              }}
            />
            <View
              style={{
                marginHorizontal: 8,
                marginBottom: 8,
                backgroundColor: "#fff",
                borderRadius: 16,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }}
            >
              {data ? (
                <ScrollView
                  contentContainerStyle={{ padding: 16, paddingBottom: 18 }}
                  showsVerticalScrollIndicator={false}
                >
                  {!!data.image_url && (
                    <Image
                      source={{ uri: data.image_url }}
                      style={{
                        width: "100%",
                        height: 200,
                        borderRadius: 12,
                        backgroundColor: "#e9eef2",
                      }}
                    />
                  )}

                  {/* Título */}
                  <Text
                    style={{
                      marginTop: 12,
                      color: C,
                      fontSize: 22,
                      fontFamily: "LibreBaskerville-Bold",
                    }}
                  >
                    {data.title}
                  </Text>

                  {/* Descripción truncada con puntos suspensivos */}
                  {!!data.description && (
                    <Text
                      numberOfLines={MAX_LINES}
                      ellipsizeMode="tail"
                      style={{
                        marginTop: 6,
                        color: "rgba(61,78,94,0.85)",
                        fontSize: 15,
                        lineHeight: 21,
                      }}
                    >
                      {data.description}
                    </Text>
                  )}

                  {/* Acciones */}
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      marginTop: 14,
                      justifyContent: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <Pressable
                      onPress={() => openMaps(data.lat, data.lng, data.title)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                        backgroundColor: "#2f6bff",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700" }}>Cómo llegar</Text>
                    </Pressable>

                    <Pressable
                      onPress={goToPost}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                        backgroundColor: "rgba(61,78,94,0.08)",
                      }}
                    >
                      <Text style={{ color: C, fontWeight: "700" }}>Ver más</Text>
                    </Pressable>

                    <Pressable
                      onPress={onClose}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 12,
                        backgroundColor: "rgba(61,78,94,0.08)",
                      }}
                    >
                      <Text style={{ color: C, fontWeight: "700" }}>Cerrar</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              ) : (
                <View style={{ padding: 18 }}>
                  <Text style={{ color: C, fontWeight: "700" }}>Menú</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
