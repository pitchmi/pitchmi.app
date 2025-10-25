// app/admin/reports.tsx
import React from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import useSWR from "swr";
import { createClient } from "@supabase/supabase-js";
import { router } from "expo-router";

type ReportRow = {
  id: string;
  pitch_id: string;
  reason: string;
  created_at: string;
};

async function fetchReports(): Promise<ReportRow[]> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase
    .from("reports")
    .select("id,pitch_id,reason,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data as any;
}

async function deleteReport(id: string) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export default function ReportsModeration() {
  const { data, isLoading, mutate } = useSWR<ReportRow[]>("/admin/reports", fetchReports, {
    revalidateOnFocus: true,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Cargando…</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={data ?? []}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => (
        <View style={{
          borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 12, marginBottom: 12
        }}>
          <Text style={{ fontWeight: "800" }}>{item.reason}</Text>
          <Text style={{ opacity: 0.6, marginTop: 4 }}>{new Date(item.created_at).toLocaleString()}</Text>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
            <Pressable onPress={() => router.push(`/pitch/${item.pitch_id}`)}>
              <Text style={{ color: "#2f6bff", fontWeight: "700" }}>Ver pitch</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                const ok = await new Promise<boolean>((resolve) =>
                  Alert.alert("Eliminar reporte", "¿Quitar de la lista?", [
                    { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
                    { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
                  ])
                );
                if (!ok) return;
                await mutate(async (curr) => {
                  await deleteReport(item.id);
                  return (curr ?? []).filter((r) => r.id !== item.id);
                }, {
                  optimisticData: (curr) => (curr ?? []).filter((r) => r.id !== item.id),
                  rollbackOnError: true, revalidate: false
                });
              }}
            >
              <Text style={{ color: "#e11d48", fontWeight: "700" }}>Eliminar</Text>
            </Pressable>
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 48, opacity: 0.6 }}>Sin reportes</Text>}
    />
  );
}
