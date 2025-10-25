// components/PortafolioCard.tsx
import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  id: string;
  title: string;
  cover?: string | null;
  isLive?: boolean;
  saved?: boolean;                                      // ← estado actual
  onToggleSave?: (id: string, next: boolean) => void;   // ← callback padre
  onPress?: () => void;                                 // ← abrir detalle
};

export default function PortafolioCard({
  id,
  title,
  cover,
  isLive,
  saved = false,
  onToggleSave,
  onPress,
}: Props) {
  return (
    <Pressable style={styles.wrap} onPress={onPress}>
      {!!cover ? (
        <Image source={{ uri: cover }} style={styles.img} resizeMode="cover" />
      ) : (
        <View style={[styles.img, { backgroundColor: "#eef2f7" }]} />
      )}

      <View style={styles.caption}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>

        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          {isLive ? (
            <View style={styles.live}>
              <Text style={styles.liveTxt}>LIVE</Text>
            </View>
          ) : null}

          <Pressable
            hitSlop={10}
            onPress={() => onToggleSave?.(id, !saved)}
            style={{ padding: 2 }}
          >
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={18}
              color={saved ? "#7C8CFF" : "#475569"}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "white",
  },
  img: { width: "100%", height: 180 },
  caption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 15, fontWeight: "600", color: "#0f172a", maxWidth: "74%" },
  live: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#7C8CFF",
  },
  liveTxt: { color: "white", fontSize: 10, fontWeight: "700" },
});
