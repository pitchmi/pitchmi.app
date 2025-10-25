// app/(tabs)/saved.tsx
import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, Image, RefreshControl, StyleSheet, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { AuthGate } from "@/hooks/useAuthGate";
import { listFavorites } from "@/services/pitches";
import type { Pitch } from "@/services/pitches";
import { toggleFav } from "@/lib/favs";

function SavedList() {
  const [items, setItems] = useState<Pitch[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const rows = await listFavorites();
      setItems(rows);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudieron cargar tus guardados.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const unsave = async (id: string) => {
    try {
      await Haptics.selectionAsync();
      await toggleFav(id);              // alterna y quita
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo actualizar el guardado.");
    }
  };

  const renderItem = ({ item }: { item: Pitch }) => (
    <Pressable
      onPress={() => router.push(`/pitch/${item.id}`)}
      style={s.card}
    >
      {!!item.image_urls?.[0] && (
        <Image
          source={{ uri: item.image_urls[0] }}
          style={s.img}
        />
      )}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={s.title} numberOfLines={1}>{item.title}</Text>
        <Pressable hitSlop={8} onPress={() => unsave(item.id)}>
          <Text style={s.unsave}>Quitar ★</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={items.length === 0 ? s.emptyWrap : { padding: 16 }}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyH}>No tienes guardados</Text>
          <Text style={s.emptyP}>Explora el mapa y guarda tus planes favoritos.</Text>
          <Pressable style={s.cta} onPress={() => router.push("/(tabs)/index")}>
            <Text style={s.ctaT}>Ir al mapa</Text>
          </Pressable>
        </View>
      }
    />
  );
}

export default function SavedTab() {
  return (
    <AuthGate>
      <SavedList />
    </AuthGate>
  );
}

const s = StyleSheet.create({
  card: { gap: 8, marginBottom: 12, backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#eef2f5" },
  img: { width: "100%", height: 160, borderRadius: 10, backgroundColor: "#f2f6f8" },
  title: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1, marginRight: 8 },
  unsave: { fontSize: 12, fontWeight: "700", color: "#e11d48" },
  emptyWrap: { flexGrow: 1, padding: 16, justifyContent: "center" },
  empty: { alignItems: "center" },
  emptyH: { fontSize: 18, fontWeight: "700", color: "#3d4e5e", marginBottom: 6 },
  emptyP: { color: "#6b7280", marginBottom: 12 },
  cta: { backgroundColor: "#2563eb", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  ctaT: { color: "#fff", fontWeight: "700" },
});
