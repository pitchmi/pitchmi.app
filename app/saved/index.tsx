// app/saved/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
  Linking,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Platform,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FONT_SERIF = "PitchmiSerif";
const FONT_SANS = "PitchmiSans";
const BRAND = "#3d4e5e";
const BG = "#f9fcfd";
const MAX_DESC = 120;

type Pitch = {
  id: string;
  title: string | null;
  description: string | null;
  image_urls: string[] | null;
  lat?: number | null;
  lng?: number | null;
  is_live?: boolean | null;
  user_id?: string | null;
};
type Row = { pitch: Pitch; folder_id: string | null; created_at: string };
type Folder = { id: string; name: string; created_at: string };

export default function Saved() {
  const { session } = useSession();
  const userId = session?.user?.id ?? null;
  const insets = useSafeAreaInsets();

  const [rows, setRows] = useState<Row[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [moveOpen, setMoveOpen] = useState(false);
  const [movingPitchId, setMovingPitchId] = useState<string | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    let alive = true;
    async function loadAll() {
      if (!userId) {
        setRows([]); setFolders([]); setLoading(false); return;
      }
      setLoading(true);

      const { data: fs } = await supabase
        .from("saved_folders")
        .select("id,name,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      let q = supabase
        .from("saved")
        .select("folder_id,created_at,pitch:pitch_id (id,title,description,image_urls,lat,lng,is_live,user_id)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (activeFolder) q = q.eq("folder_id", activeFolder);

      const { data: it } = await q;
      if (!alive) return;

      setFolders((fs ?? []) as Folder[]);
      setRows(((it ?? []) as any[])
        .map((r: any) => ({ pitch: r.pitch as Pitch, folder_id: r.folder_id, created_at: r.created_at }))
        .filter((r) => r.pitch));
      setLoading(false);
    }
    loadAll();
    return () => { alive = false; };
  }, [userId, activeFolder]);

  const items = useMemo(() => rows.map((r) => r.pitch), [rows]);

  const folderCounts = useMemo(() => {
    const m: Record<string, number> = {};
    rows.forEach((r) => { const k = r.folder_id ?? "null"; m[k] = (m[k] || 0) + 1; });
    return m;
  }, [rows]);

  const currentFolder = useMemo(
    () => (activeFolder ? folders.find((f) => f.id === activeFolder) ?? null : null),
    [activeFolder, folders]
  );
  const currentCount = activeFolder ? (folderCounts[activeFolder] ?? 0) : items.length;

  function directionsURL(p: Pitch): string {
    if (typeof p.lat === "number" && typeof p.lng === "number") {
      return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
    }
    const q = encodeURIComponent(p.title ?? "Destino");
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  async function createFolder() {
    const name = newFolderName.trim();
    if (!userId || !name) return;
    const { error } = await supabase.from("saved_folders").insert({ user_id: userId, name });
    if (error) { alert(error.message); return; }
    setNewFolderOpen(false); setNewFolderName("");
    const { data } = await supabase
      .from("saved_folders")
      .select("id,name,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    setFolders((data ?? []) as Folder[]);
  }

  async function moveToFolder(targetFolderId: string | null) {
    if (!userId || !movingPitchId) return;
    const { error } = await supabase
      .from("saved")
      .update({ folder_id: targetFolderId })
      .eq("user_id", userId)
      .eq("pitch_id", movingPitchId);
    if (error) alert(error.message);
    setMoveOpen(false); setMovingPitchId(null);
    setRows((prev) => prev.map((r) => (r.pitch.id === movingPitchId ? { ...r, folder_id: targetFolderId } : r)));
  }

  async function removeFromFolder(pitchId: string) {
    if (!userId) return;
    const { error } = await supabase
      .from("saved")
      .update({ folder_id: null })
      .eq("user_id", userId)
      .eq("pitch_id", pitchId);
    if (error) { alert(error.message); return; }
    setRows((prev) => prev.map((r) => (r.pitch.id === pitchId ? { ...r, folder_id: null } : r)));
  }

  async function renameFolder() {
    if (!userId || !renameId) return;
    const nv = renameValue.trim();
    if (!nv) { setRenameOpen(false); return; }
    const { error } = await supabase
      .from("saved_folders")
      .update({ name: nv })
      .eq("id", renameId)
      .eq("user_id", userId);
    if (error) alert(error.message);
    setFolders((prev) => prev.map((f) => (f.id === renameId ? { ...f, name: nv } : f)));
    setRenameOpen(false); setRenameId(null); setRenameValue("");
  }

  async function deleteFolder(folderId: string) {
    if (!userId) return;
    const { error } = await supabase.from("saved_folders").delete().eq("id", folderId).eq("user_id", userId);
    if (error) { alert(error.message); return; }
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (activeFolder === folderId) setActiveFolder(null);
  }

  if (!userId) return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.body}>Inicia sesión para ver Guardados.</Text>
    </SafeAreaView>
  );
  if (loading) return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator />
    </SafeAreaView>
  );

  const screenW = Dimensions.get("window").width;
  const COLS = screenW >= 1200 ? 8 : screenW >= 1024 ? 7 : screenW >= 820 ? 6 : screenW >= 640 ? 5 : 4;
  const GAP = 6;
  const tileW = (screenW - 16 - 16 - GAP * (COLS - 1)) / COLS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* Header con margen derecho seguro */}
      <View style={[styles.header, { paddingRight: 16 + insets.right }]}>
        <View>
          <Text style={styles.hTitle}>Guardados</Text>
          <Text style={styles.hSubtitle}>organiza tus pitch por carpetas.</Text>
        </View>
        <Pressable onPress={() => setNewFolderOpen(true)} style={styles.newBtn}>
          <Ionicons name="add" size={15} color={BRAND} />
          <Text style={styles.newBtnText}>Nueva</Text>
        </Pressable>
      </View>

      <View style={{ height: 18 }} />

      {currentFolder && (
        <View style={styles.folderBar}>
          <Pressable onPress={() => setActiveFolder(null)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={14} color={BRAND} />
            <Text style={styles.backText}>Todas</Text>
          </Pressable>

          <View style={styles.folderBarMain}>
            <View style={styles.folderBarIcon}>
              <Ionicons name="folder-outline" size={14} color="#334155" />
            </View>
            <Text numberOfLines={1} style={styles.folderBarName}>{currentFolder.name}</Text>
            <View style={styles.folderBarBadge}><Text style={styles.folderBarBadgeText}>{currentCount}</Text></View>
          </View>

          <View style={styles.folderBarActions}>
            <Pressable onPress={() => { setRenameId(currentFolder.id); setRenameValue(currentFolder.name); setRenameOpen(true); }} hitSlop={8}>
              <Ionicons name="create-outline" size={16} color="#64748b" />
            </Pressable>
            <Pressable onPress={() => deleteFolder(currentFolder.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Grid de carpetas */}
      <View style={[styles.folderGrid, { columnGap: GAP, rowGap: GAP }]}>
        {([{ id: "ALL", name: "Todas", created_at: "" } as Folder, ...folders]).map((f) => {
          const isAll = f.id === "ALL";
          const active = (activeFolder === null && isAll) || activeFolder === f.id;
          const count = isAll ? items.length : folderCounts[f.id] ?? 0;
          return (
            <View key={f.id} style={{ width: tileW }}>
              <Pressable
                onPress={() => setActiveFolder(isAll ? null : f.id)}
                style={[styles.folderChip, active && styles.folderChipActive]}
              >
                <Ionicons name={isAll ? "albums-outline" : "folder-outline"} size={14} color={active ? "#fff" : "#334155"} />
                <Text numberOfLines={1} style={[styles.folderChipText, active && styles.folderChipTextActive]}>
                  {f.name}
                </Text>
                <View style={[styles.folderBadge, active && styles.folderBadgeActive]}>
                  <Text style={[styles.folderBadgeText, active && styles.folderBadgeTextActive]}>{count}</Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* Lista: toda la tarjeta navega al pitch */}
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }}
        ListEmptyComponent={<View style={{ padding: 32 }}><Text style={styles.body}>No hay guardados aquí.</Text></View>}
        renderItem={({ item }) => {
          const img = item.image_urls?.[0] ?? null;
          const insideFolder = !!activeFolder;
          const desc = item.description ?? "";
          const isLong = desc.length > MAX_DESC;
          const preview = isLong ? desc.slice(0, MAX_DESC) : desc;

          return (
            <View style={styles.card}>
              <Pressable onPress={() => router.push(`/pitch/${item.id}`)}>
                <View style={{ borderRadius: 18, overflow: "hidden" }}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.cardImg} />
                  ) : (
                    <View style={[styles.cardImg, styles.placeholder]}>
                      <Ionicons name="image-outline" size={18} color="#6b7280" />
                    </View>
                  )}
                  {item.is_live ? (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  ) : null}
                </View>

                <Text numberOfLines={1} style={styles.cardTitle}>
                  {item.title ?? "Sin título"}
                </Text>

                {!!preview && (
                  <Text style={styles.cardDesc}>
                    {preview}
                    {isLong ? <Text style={styles.readMore}> {" "}… Leer más</Text> : null}
                  </Text>
                )}
              </Pressable>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <Pressable onPress={() => Linking.openURL(directionsURL(item))} style={styles.btn} hitSlop={6}>
                  <Ionicons name="navigate-outline" size={14} color="#0f172a" />
                  <Text style={styles.btnText}>Cómo ir</Text>
                </Pressable>

                <Pressable onPress={() => { setMovingPitchId(item.id); setMoveOpen(true); }} style={[styles.btn, { backgroundColor: "#eaf0f2" }]} hitSlop={6}>
                  <Ionicons name="folder-open-outline" size={14} color="#0f172a" />
                  <Text style={styles.btnText}>Mover</Text>
                </Pressable>

                {insideFolder && (
                  <Pressable onPress={() => removeFromFolder(item.id)} style={[styles.btn, { backgroundColor: "#f1f5f9" }]} hitSlop={6}>
                    <Ionicons name="remove-circle-outline" size={14} color="#0f172a" />
                    <Text style={styles.btnText}>Quitar</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Nueva carpeta */}
      <Modal transparent visible={newFolderOpen} animationType="fade" onRequestClose={() => setNewFolderOpen(false)}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? Math.max(48, insets.top) : 0} style={{ width: "100%" }}>
            <BlurView intensity={28} tint="light" style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>Nueva carpeta</Text>
              <TextInput autoFocus value={newFolderName} onChangeText={setNewFolderName} placeholder="Nombre" placeholderTextColor="#9ca3af" style={styles.input} returnKeyType="done" onSubmitEditing={createFolder} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={() => setNewFolderOpen(false)} style={[styles.cta, styles.ghost]}><Text style={styles.ghostText}>Cancelar</Text></Pressable>
                <Pressable onPress={createFolder} style={[styles.cta, styles.primary]}><Text style={styles.primaryText}>Crear</Text></Pressable>
              </View>
            </BlurView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Mover */}
      <Modal transparent visible={moveOpen} animationType="fade" onRequestClose={() => setMoveOpen(false)}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? Math.max(48, insets.top) : 0} style={{ width: "100%" }}>
            <BlurView intensity={28} tint="light" style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>Mover a carpeta</Text>
              <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 8, marginBottom: 12 }} keyboardShouldPersistTaps="handled">
                <Pressable onPress={() => moveToFolder(null)} style={styles.row}>
                  <Ionicons name="albums-outline" size={16} color="#0f172a" />
                  <Text style={styles.rowText}>Sin carpeta</Text>
                </Pressable>
                {folders.map((f) => (
                  <Pressable key={f.id} onPress={() => moveToFolder(f.id)} style={styles.row}>
                    <Ionicons name="folder-outline" size={16} color="#0f172a" />
                    <Text style={styles.rowText}>{f.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={() => setMoveOpen(false)} style={[styles.cta, styles.ghost]}><Text style={styles.ghostText}>Cerrar</Text></Pressable>
              </View>
            </BlurView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Renombrar */}
      <Modal transparent visible={renameOpen} animationType="fade" onRequestClose={() => setRenameOpen(false)}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? Math.max(48, insets.top) : 0} style={{ width: "100%" }}>
            <BlurView intensity={28} tint="light" style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>Renombrar carpeta</Text>
              <TextInput autoFocus value={renameValue} onChangeText={setRenameValue} placeholder="Nuevo nombre" placeholderTextColor="#9ca3af" style={styles.input} returnKeyType="done" onSubmitEditing={renameFolder} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={() => setRenameOpen(false)} style={[styles.cta, styles.ghost]}><Text style={styles.ghostText}>Cancelar</Text></Pressable>
                <Pressable onPress={renameFolder} style={[styles.cta, styles.primary]}><Text style={styles.primaryText}>Guardar</Text></Pressable>
              </View>
            </BlurView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const baseText = {
  fontFamily: Platform.select({
    ios: `${FONT_SANS}, System`,
    android: `${FONT_SANS}`,
    default: FONT_SANS,
  }),
  color: "#0f172a",
} as const;

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  body: { ...baseText, fontSize: 14 },

  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 6, android: 8 }),
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  hTitle: {
    fontSize: 32,
    color: BRAND,
    fontWeight: "700",
    fontFamily: Platform.select({
      ios: `${FONT_SERIF}, Times`,
      android: `${FONT_SERIF}`,
      default: FONT_SERIF,
    }),
  },
  hSubtitle: { ...baseText, marginTop: 2, fontSize: 12, color: BRAND },

  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "#e6f3f8",
    marginRight: 4,
  },
  newBtnText: { ...baseText, color: BRAND, fontWeight: "800", fontSize: 11 },

  folderBar: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#eef5f8",
  },
  backText: { ...baseText, color: BRAND, fontWeight: "800", fontSize: 11 },
  folderBarMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#eaf0f2",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.12)",
  },
  folderBarIcon: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(2,6,23,0.06)",
  },
  folderBarName: { ...baseText, flex: 1, fontWeight: "900", fontSize: 12 },
  folderBarBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999,
    backgroundColor: "#e6f3f8", borderWidth: 1, borderColor: "rgba(51,65,85,0.12)",
  },
  folderBarBadgeText: { ...baseText, fontSize: 10, fontWeight: "900" },
  folderBarActions: { flexDirection: "row", alignItems: "center", gap: 10 },

  folderGrid: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  folderChip: {
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: "#eaf0f2",
    borderWidth: 1,
    borderColor: "rgba(51,65,85,0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  folderChipActive: { backgroundColor: BRAND, borderColor: "transparent" },
  folderChipText: { ...baseText, flex: 1, color: "#334155", fontWeight: "800", fontSize: 12 },
  folderChipTextActive: { color: "#fff" },
  folderBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999,
    backgroundColor: "#e6f3f8", borderWidth: 1, borderColor: "rgba(51,65,85,0.12)",
  },
  folderBadgeActive: { backgroundColor: "#fff", borderColor: "transparent" },
  folderBadgeText: { ...baseText, fontSize: 11, fontWeight: "900" },
  folderBadgeTextActive: { color: "#0f172a" },

  card: { backgroundColor: "transparent" },
  cardImg: { width: "100%", height: 180, borderRadius: 18, backgroundColor: "#eef5f8" },
  placeholder: { justifyContent: "center", alignItems: "center" },
  cardTitle: {
    marginTop: 8,
    fontSize: 18,
    color: BRAND,
    fontFamily: Platform.select({
      ios: `${FONT_SERIF}, Times`,
      android: `${FONT_SERIF}`,
      default: FONT_SERIF,
    }),
    fontWeight: "700",
  },
  cardDesc: { ...baseText, fontSize: 12, color: "#4b5563", marginTop: 2 },
  readMore: { color: BRAND, fontWeight: "800" },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#e6f3f8",
  },
  btnText: { ...baseText, fontSize: 12, fontWeight: "800" },

  liveBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fee2e2",
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" },
  liveText: { ...baseText, fontSize: 12, fontWeight: "900", color: "#991b1b" },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "flex-end" },
  sheet: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: "rgba(61,78,94,0.1)",
  },
  grabber: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "rgba(61,78,94,0.22)", marginBottom: 10, marginTop: 6 },
  sheetTitle: { ...baseText, fontSize: 16, fontWeight: "900" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    fontSize: 14,
    color: "#111827",
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: `${FONT_SANS}, System`,
      android: `${FONT_SANS}`,
      default: FONT_SANS,
    }),
  },
  cta: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  ghost: { borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  ghostText: { ...baseText, fontWeight: "800" },
  primary: { backgroundColor: BRAND },
  primaryText: { ...baseText, color: "#fff", fontWeight: "900" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f4f7f9",
  },
  rowText: { ...baseText, fontWeight: "800" },
});
