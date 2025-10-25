import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

const C2 = "#3d4e5e";

export type EditorState = {
  title: string;
  subtitle: string;
  // texto
  color: string;
  align: "left" | "center" | "right";
  size: number; // dp
  weight: "regular" | "bold";
  shadow: boolean;
  // imagen
  fit: "cover" | "contain";
  zoom: number; // 1..3
  offsetX: number; // px
  offsetY: number; // px
  // estilo extra
  overlay: number; // 0..0.6
  overlayColor: string;
};

type Props = {
  visible: boolean;
  value: EditorState;
  onChange: (patch: Partial<EditorState>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void; // opcional
};

const COLORS = ["#ffffff", "#3d4e5e", "#1a1f24", "#e33d5b", "#2f6bff", "#18a957", "#f59f0a"];

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: active ? "rgba(47,107,255,0.12)" : "rgba(61,78,94,0.06)",
        borderWidth: 1,
        borderColor: active ? "rgba(47,107,255,0.35)" : "rgba(61,78,94,0.12)",
        marginRight: 8,
      }}
    >
      <Text style={{ color: C2, fontWeight: active ? "800" : "600" }}>{label}</Text>
    </Pressable>
  );
}

function Seg({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string }[];
  value: string;
  onChange: (k: string) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "rgba(61,78,94,0.06)",
        borderRadius: 10,
        padding: 4,
      }}
    >
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 8,
              alignItems: "center",
              backgroundColor: active ? "#fff" : "transparent",
              borderWidth: active ? 1 : 0,
              borderColor: active ? "rgba(61,78,94,0.15)" : "transparent",
            }}
          >
            <Text style={{ color: C2, fontWeight: active ? "800" : "600" }}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Dot({
  color,
  active,
  onPress,
}: {
  color: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: color,
        marginRight: 10,
        borderWidth: active ? 3 : 1,
        borderColor: active ? "rgba(61,78,94,0.6)" : "rgba(61,78,94,0.2)",
      }}
    />
  );
}

function IconBtn({
  name,
  label,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(61,78,94,0.12)",
        marginRight: 8,
      }}
    >
      <Ionicons name={name} size={18} color={C2} />
      {label ? (
        <Text style={{ color: C2, marginLeft: 6, fontWeight: "700" }}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

export default function PortafolioEditor({
  visible,
  value,
  onChange,
  onSave,
  onCancel,
  onDelete,
}: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"texto" | "imagen" | "estilo">("texto");
  if (!visible) return null;

  const set = (patch: Partial<EditorState>) => onChange(patch);
  const inc = (key: keyof EditorState, step: number, min = -999, max = 999) => {
    const v = (value[key] as unknown as number) ?? 0;
    const next = Math.min(max, Math.max(min, v + step));
    set({ [key]: next } as any);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
    >
      <BlurView
        tint="light"
        intensity={28}
        style={{
          paddingBottom: insets.bottom + 10,
          paddingTop: 10,
          paddingHorizontal: 14,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
          borderTopWidth: 1,
          borderColor: "rgba(61,78,94,0.1)",
        }}
      >
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 6 }}>
          <View
            style={{
              width: 44,
              height: 5,
              borderRadius: 3,
              backgroundColor: "rgba(61,78,94,0.22)",
            }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: C2, fontWeight: "900", fontSize: 18 }}>Editor</Text>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onCancel();
            }}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
          >
            <Text style={{ color: C2, fontWeight: "800" }}>Cerrar</Text>
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <Chip label="Texto" active={tab === "texto"} onPress={() => setTab("texto")} />
          <Chip label="Imagen" active={tab === "imagen"} onPress={() => setTab("imagen")} />
          <Chip label="Estilo" active={tab === "estilo"} onPress={() => setTab("estilo")} />
        </View>

        <ScrollView style={{ maxHeight: 330 }} contentContainerStyle={{ paddingBottom: 10 }} keyboardShouldPersistTaps="handled">
          {/* TEXTO */}
          {tab === "texto" && (
            <View>
              <Text style={{ color: C2, fontWeight: "800", marginBottom: 6 }}>Texto</Text>
              <TextInput
                placeholder="Título sobre la foto"
                placeholderTextColor="rgba(61,78,94,0.35)"
                value={value.title}
                onChangeText={(t) => set({ title: t })}
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "rgba(61,78,94,0.12)",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  color: C2,
                  fontWeight: value.weight === "bold" ? "900" : "700",
                  marginBottom: 10,
                }}
              />
              <TextInput
                placeholder="Subtítulo opcional"
                placeholderTextColor="rgba(61,78,94,0.35)"
                value={value.subtitle}
                onChangeText={(t) => set({ subtitle: t })}
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "rgba(61,78,94,0.12)",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  color: C2,
                  marginBottom: 14,
                }}
              />

              <Text style={{ color: C2, fontWeight: "800", marginBottom: 8 }}>
                Alineación
              </Text>
              <Seg
                items={[
                  { key: "left", label: "Izq." },
                  { key: "center", label: "Centro" },
                  { key: "right", label: "Der." },
                ]}
                value={value.align}
                onChange={(k) => set({ align: k as EditorState["align"] })}
              />

              <View style={{ height: 12 }} />

              <Text style={{ color: C2, fontWeight: "800", marginBottom: 8 }}>
                Tamaño y peso
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <IconBtn
                  name="remove-outline"
                  label="A–"
                  onPress={() => inc("size", -2, 12, 64)}
                />
                <Text style={{ color: C2, marginHorizontal: 8, fontWeight: "800" }}>
                  {Math.round(value.size)} pt
                </Text>
                <IconBtn
                  name="add-outline"
                  label="A+"
                  onPress={() => inc("size", +2, 12, 64)}
                />
                <View style={{ width: 10 }} />
                <Seg
                  items={[
                    { key: "regular", label: "Regular" },
                    { key: "bold", label: "Negrita" },
                  ]}
                  value={value.weight}
                  onChange={(k) => set({ weight: k as EditorState["weight"] })}
                />
              </View>

              <View style={{ height: 12 }} />

              <Text style={{ color: C2, fontWeight: "800", marginBottom: 8 }}>Color</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                {COLORS.map((cc) => (
                  <Dot
                    key={cc}
                    color={cc}
                    active={value.color === cc}
                    onPress={() => set({ color: cc })}
                  />
                ))}
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Chip
                  label={value.shadow ? "Sombra: sí" : "Sombra: no"}
                  active={value.shadow}
                  onPress={() => set({ shadow: !value.shadow })}
                />
              </View>
            </View>
          )}

          {/* IMAGEN */}
          {tab === "imagen" && (
            <View>
              <Text style={{ color: C2, fontWeight: "800", marginBottom: 8 }}>Ajuste</Text>
              <Seg
                items={[
                  { key: "cover", label: "Cover" },
                  { key: "contain", label: "Contain" },
                ]}
                value={value.fit}
                onChange={(k) => set({ fit: k as EditorState["fit"] })}
              />

              <View style={{ height: 12 }} />

              <Text style={{ color: C2, fontWeight: "800", marginBottom: 8 }}>Zoom</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <IconBtn
                  name="remove-outline"
                  onPress={() => inc("zoom", -0.1, 1, 3)}
                />
                <Text style={{ color: C2, marginHorizontal: 8, fontWeight: "800" }}>
                  {value.zoom.toFixed(1)}x
                </Text>
                <IconBtn name="add-outline" onPress={() => inc("zoom", +0.1, 1, 3)} />
              </View>

              <View style={{ height: 12 }} />

              <Text style={{ color: C2, fontWeight: "800", marginBottom: 8 }}>
                Desplazar
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                <IconBtn name="caret-up-outline" onPress={() => inc("offsetY", -20)} />
                <IconBtn name="caret-down-outline" onPress={() => inc("offsetY", +20)} />
                <IconBtn name="caret-back-outline" onPress={() => inc("offsetX", -20)} />
                <IconBtn name="caret-forward-outline" onPress={() => inc("offsetX", +20)} />
              </View>
            </View>
          )}

          {/* ESTILO */}
          {tab === "estilo" && (
            <View>
              <Text style={{ color: C2, fontWeight: "800", marginBottom: 8 }}>
                Overlay y contraste
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                {COLORS.map((cc) => (
                  <Dot
                    key={cc + "_ov"}
                    color={cc}
                    active={value.overlayColor === cc}
                    onPress={() => set({ overlayColor: cc })}
                  />
                ))}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <IconBtn
                  name="remove-outline"
                  label="–"
                  onPress={() => inc("overlay", -0.05, 0, 0.6)}
                />
                <Text style={{ color: C2, marginHorizontal: 8, fontWeight: "800" }}>
                  Opacidad {Math.round(value.overlay * 100)}%
                </Text>
                <IconBtn
                  name="add-outline"
                  label="+"
                  onPress={() => inc("overlay", +0.05, 0, 0.6)}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onCancel();
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "rgba(61,78,94,0.12)",
              alignItems: "center",
            }}
          >
            <Text style={{ color: C2, fontWeight: "800" }}>Cancelar</Text>
          </Pressable>

          {onDelete ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDelete();
              }}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#fee2e2",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#991b1b", fontWeight: "900" }}>Borrar</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onSave();
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: "#2f6bff",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>Guardar</Text>
          </Pressable>
        </View>
      </BlurView>
    </KeyboardAvoidingView>
  );
}
