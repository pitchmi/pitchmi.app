// app/portafolio.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, Image, StyleSheet, SafeAreaView, Pressable, Dimensions,
  Platform, ScrollView, Alert, ActivityIndicator, FlatList, Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import PortafolioEditor, { EditorState } from "@/components/ui/PortafolioEditor";

type FitMode = "cover" | "contain";
type Pitch = {
  id: string;
  title: string | null;
  description: string | null;
  image_urls: string[] | null;
  created_at: string;
  user_id?: string;
  lat?: number | null;
  lng?: number | null;
  is_live?: boolean | null;
};

const PAGE_SIZE = 6;

export default function Portafolio() {
  const heroHeight = Math.max(420, Math.floor(Dimensions.get("window").height * 0.62));
  const { session } = useSession();
  const userId = session?.user?.id ?? null;
  const { id: idParam } = useLocalSearchParams<{ id?: string }>();

  const [loading, setLoading] = useState(true);
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [previous, setPrevious] = useState<Pitch[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);

  // estado del post activo
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [ed, setEd] = useState<EditorState>({
    title: "", subtitle: "", color: "#3d4e5e", align: "left",
    size: 28, weight: "bold", shadow: false, fit: "cover",
    zoom: 1, offsetX: 0, offsetY: 0, overlay: 0, overlayColor: "#000000",
  });

  useEffect(() => {
    let alive = true;
    async function bootstrap() {
      setLoading(true);

      if (idParam) {
        // carga específica por id cuando viene de "Ver más"
        const { data, error } = await supabase
          .from("pitches")
          .select("id,title,description,image_urls,created_at,user_id,lat,lng,is_live")
          .eq("id", idParam)
          .maybeSingle();
        if (!alive) return;
        if (error) Alert.alert("Error", error.message);
        const byId = (data ?? null) as Pitch | null;
        setPitch(byId);
        syncFromPitch(byId);
      } else {
        // último pitch por usuario o global
        let base = supabase
          .from("pitches")
          .select("id,title,description,image_urls,created_at,user_id,lat,lng,is_live")
          .order("created_at", { ascending: false })
          .limit(1);
        const { data: latest, error: e1 } = userId ? await base.eq("user_id", userId) : await base;
        if (!alive) return;
        if (e1) Alert.alert("Error", e1.message);
        const first = (latest ?? [])[0] as Pitch | undefined;
        setPitch(first ?? null);
        syncFromPitch(first ?? null);
      }

      // total para paginar (excluye el primero)
      let countQ = supabase.from("pitches").select("id", { count: "exact", head: true });
      const { count } = userId ? await countQ.eq("user_id", userId) : await countQ;
      if (!alive) return;
      const totalPrev = Math.max(0, (count ?? 0) - 1);
      setTotalPages(Math.max(1, Math.ceil(totalPrev / PAGE_SIZE)));

      await loadPage(1, userId);
      setLoading(false);
    }
    bootstrap();
    return () => { alive = false; };
  }, [userId, idParam]);

  async function loadPage(p: number, uid: string | null) {
    const offset = 1 + (p - 1) * PAGE_SIZE; // salta el más reciente
    const to = offset + PAGE_SIZE - 1;

    let q = supabase
      .from("pitches")
      .select("id,title,description,image_urls,created_at,user_id,lat,lng,is_live")
      .order("created_at", { ascending: false })
      .range(offset, to);

    const { data, error } = uid ? await q.eq("user_id", uid) : await q;
    if (error) {
      Alert.alert("Error", error.message);
      setPrevious([]);
      return;
    }
    setPrevious((data ?? []) as Pitch[]);
    setPage(p);
  }

  function syncFromPitch(p: Pitch | null) {
    const t = p?.title ?? "";
    const d = p?.description ?? "";
    setTitle(t);
    setDescription(d);
    setEd((prev) => ({ ...prev, title: t, subtitle: d }));
  }

  const images: string[] = useMemo(() => {
    const arr = Array.isArray(pitch?.image_urls) ? pitch!.image_urls! : [];
    return arr.filter(Boolean);
  }, [pitch]);

  function directionsURL(p: Pitch | null): string {
    if (!p) return "https://maps.google.com";
    const lat = p.lat ?? null;
    const lng = p.lng ?? null;
    if (typeof lat === "number" && typeof lng === "number") {
      return Platform.select({
        ios: `http://maps.apple.com/?daddr=${lat},${lng}`,
        android: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      })!;
    }
    const q = encodeURIComponent(p.title ?? "Destino");
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  const canEdit = !!userId && pitch?.user_id === userId;

  async function handleSaveEditor() {
    if (!canEdit || !pitch?.id) { setEditorOpen(false); return; }
    const { error } = await supabase
      .from("pitches")
      .update({ title: ed.title, description: ed.subtitle })
      .eq("id", pitch.id);
    if (error) Alert.alert("No guardado", error.message);
    else {
      const updated = { ...pitch, title: ed.title, description: ed.subtitle };
      setPitch(updated);
      setTitle(ed.title);
      setDescription(ed.subtitle);
    }
    setEditorOpen(false);
  }

  async function handleDeletePitch() {
    if (!canEdit || !pitch?.id) { setEditorOpen(false); return; }
    const { error } = await supabase.from("pitches").delete().eq("id", pitch.id);
    if (error) {
      Alert.alert("No borrado", error.message);
      return;
    }
    Alert.alert("Borrado", "El pitch se eliminó.");
    setEditorOpen(false);
    const { data: latest } = await supabase
      .from("pitches")
      .select("id,title,description,image_urls,created_at,user_id,lat,lng,is_live")
      .order("created_at", { ascending: false })
      .limit(1)
      .eq("user_id", userId!);
    const first = (latest ?? [])[0] as Pitch | undefined;
    setPitch(first ?? null);
    syncFromPitch(first ?? null);
    await loadPage(1, userId);
  }

  async function handleSavePitch(p: Pitch | null) {
    if (!p?.id) return;
    if (!userId) { Alert.alert("Necesitas iniciar sesión"); return; }
    const { error } = await supabase
      .from("saved")
      .upsert(
        { user_id: userId, pitch_id: p.id },
        { onConflict: "user_id,pitch_id", ignoreDuplicates: true }
      );
    if (error) Alert.alert("No guardado", error.message);
    else Alert.alert("Guardado", "El pitch se guardó en Guardados.");
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const fontWeight = ed.weight === "bold" ? "900" : "700";
  const textShadow = ed.shadow
    ? { textShadowColor: "rgba(0,0,0,0.35)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }
    : undefined;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.hTitle}>Portafolio</Text>
          <Text style={styles.hSubtitle}>agenda viva de rutas y memorias.</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push("/saved")} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="bookmark-outline" size={18} color="#3d4e5e" />
            <Text style={styles.iconBtnText}>Guardados</Text>
          </Pressable>
          {canEdit && (
            <Pressable onPress={() => setEditorOpen(true)} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Editar</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView>
        {/* Aire extra */}
        <View style={{ height: 12 }} />

        {/* Imagen + LIVE */}
        <View style={[styles.hero, { height: heroHeight }]}>
          {pitch?.is_live ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : null}

          {images.length > 0 ? (
            <FlatList
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              data={images} keyExtractor={(u, i) => `${u}-${i}`}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  resizeMode={ed.fit as FitMode}
                  style={[
                    styles.heroImg,
                    { transform: [{ scale: ed.zoom }, { translateX: ed.offsetX }, { translateY: ed.offsetY }] },
                  ]}
                />
              )}
            />
          ) : (
            <View style={[styles.heroImg, styles.heroFallback]}>
              <Text style={{ color: "#6b7280" }}>Sin imagen</Text>
            </View>
          )}
          {ed.overlay > 0 && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: rgba(ed.overlayColor, ed.overlay) }]} />
          )}
        </View>

        {/* Texto + acciones */}
        <View style={styles.contentCard}>
          <Text
            style={[
              styles.titleBelow,
              { color: ed.color, textAlign: ed.align, fontSize: Math.max(ed.size, 24), fontWeight },
              textShadow as any,
            ]}
          >
            {title || "Sin título"}
          </Text>
          <Text
            style={[
              styles.descBelow,
              { color: ed.color, textAlign: ed.align },
              textShadow as any,
            ]}
          >
            {description || "Añade una descripción para tu pitch."}
          </Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable onPress={() => Linking.openURL(directionsURL(pitch))} style={styles.directionsBtn}>
              <Ionicons name="navigate-outline" size={16} color="#0f172a" />
              <Text style={styles.directionsText}>Cómo ir</Text>
            </Pressable>
            <Pressable onPress={() => handleSavePitch(pitch)} style={styles.saveBtn}>
              <Ionicons name="bookmark" size={16} color="#0f172a" />
              <Text style={styles.saveText}>Guardar pitch</Text>
            </Pressable>
            {pitch?.user_id ? (
              <Pressable
                onPress={() => router.push({ pathname: "/u/[id]", params: { id: pitch.user_id } })}
                style={[styles.directionsBtn, { backgroundColor: "#e6f3f8" }]}
              >
                <Ionicons name="person-circle-outline" size={16} color="#0f172a" />
                <Text style={styles.directionsText}>Ver perfil</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Tus pitch anteriores */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>Tus pitch anteriores</Text>
        </View>

        {/* Paginación */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {pages.map((p) => (
              <Pressable key={p} onPress={() => loadPage(p, userId)} style={[styles.pageChip, p === page && styles.pageChipActive]}>
                <Text style={[styles.pageChipText, p === page && styles.pageChipTextActive]}>{p}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.feed}>
          {previous.length === 0 ? (
            <Text style={{ color: "#6b7280" }}>No hay más pitch.</Text>
          ) : (
            previous.map((p) => {
              const thumb = Array.isArray(p.image_urls) && p.image_urls[0] ? p.image_urls[0] : null;
              return (
                <Pressable key={p.id} onPress={() => { setPitch(p); syncFromPitch(p); }} style={styles.postCard}>
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={styles.postThumb} />
                  ) : (
                    <View style={[styles.postThumb, styles.heroFallback]}>
                      <Ionicons name="image-outline" size={16} color="#6b7280" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text numberOfLines={1} style={styles.postTitle}>{p.title ?? "Sin título"}</Text>
                      {p.is_live ? <View style={styles.inlineLive}><View style={styles.liveDotSm}/><Text style={styles.inlineLiveText}>LIVE</Text></View> : null}
                    </View>
                    <Text numberOfLines={2} style={styles.postDesc}>{p.description ?? ""}</Text>
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                      <Pressable onPress={() => Linking.openURL(directionsURL(p))} style={styles.inlineDirections} hitSlop={6}>
                        <Ionicons name="navigate-outline" size={14} color="#0f172a" />
                        <Text style={styles.inlineDirectionsText}>Cómo ir</Text>
                      </Pressable>
                      <Pressable onPress={() => handleSavePitch(p)} style={styles.inlineSave} hitSlop={6}>
                        <Ionicons name="bookmark" size={14} color="#0f172a" />
                        <Text style={styles.inlineSaveText}>Guardar</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Editor solo dueño, con botón borrar */}
      <PortafolioEditor
        visible={editorOpen && canEdit}
        value={ed}
        onChange={(patch) => setEd((prev) => ({ ...prev, ...patch }))}
        onSave={handleSaveEditor}
        onCancel={() => setEditorOpen(false)}
        onDelete={handleDeletePitch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fcfd" },

  header: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: Platform.select({ ios: 0, android: 8 }), paddingBottom: 8,
  },
  hTitle: { fontSize: 28, fontWeight: "800", color: "#3d4e5e" },
  hSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  headerActions: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  iconBtn: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: 10, backgroundColor: "#e6f3f8", marginRight: 8,
  },
  iconBtnText: { marginLeft: 6, color: "#3d4e5e", fontWeight: "600", fontSize: 11 },
  headerBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "#3d4e5e" },
  headerBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  hero: { width: "100%", position: "relative" },
  heroImg: { width: Dimensions.get("window").width, height: "100%" },
  heroFallback: { backgroundColor: "#eef5f8", justifyContent: "center", alignItems: "center" },

  liveBadge: {
    position: "absolute", top: 10, left: 10, zIndex: 10,
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#fee2e2",
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" },
  liveText: { fontSize: 12, fontWeight: "900", color: "#991b1b" },

  contentCard: { marginTop: 14, marginHorizontal: 16, backgroundColor: "transparent" },
  titleBelow: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  descBelow: { fontSize: 14, lineHeight: 20 },

  directionsBtn: {
    marginTop: 12, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#e6f3f8",
  },
  directionsText: { fontWeight: "700", color: "#0f172a", fontSize: 13 },

  saveBtn: {
    marginTop: 12, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#eaf0f2",
  },
  saveText: { fontWeight: "700", color: "#0f172a", fontSize: 13 },

  listHeader: { paddingHorizontal: 16, paddingTop: 14 },
  listHeaderText: { fontSize: 14, fontWeight: "700", color: "#111827" },

  pageChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "#eaf0f2" },
  pageChipActive: { backgroundColor: "#3d4e5e" },
  pageChipText: { color: "#0f172a", fontWeight: "700", fontSize: 12 },
  pageChipTextActive: { color: "#fff" },

  feed: { padding: 16, paddingTop: 10 },

  postCard: { flexDirection: "row", backgroundColor: "transparent", paddingVertical: 6, marginBottom: 12, gap: 10 },
  postThumb: { width: 84, height: 84, borderRadius: 12, backgroundColor: "#eef5f8" },
  postTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  postDesc: { fontSize: 12, color: "#4b5563", marginTop: 2 },

  inlineDirections: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#e6f3f8",
  },
  inlineDirectionsText: { fontSize: 12, fontWeight: "700", color: "#0f172a" },
  inlineSave: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#eaf0f2",
  },
  inlineSaveText: { fontSize: 12, fontWeight: "700", color: "#0f172a" },

  inlineLive: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: "#fee2e2",
  },
  liveDotSm: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" },
  inlineLiveText: { fontSize: 10, fontWeight: "900", color: "#991b1b" },
});

function rgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
