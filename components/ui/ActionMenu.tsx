// components/ui/ActionMenu.tsx
import React, { useCallback, useMemo, useState } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ActionItem = { id: string; label: string; onPress: () => void | Promise<void> };

export default function ActionMenu({ items }: { items: ActionItem[] }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen(v => !v), []);
  const wired = useMemo(
    () => items.map(it => ({ ...it, onPress: async () => { try { await it.onPress(); } finally { setOpen(false); } } })),
    [items]
  );

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
      <Pressable onPress={toggle} hitSlop={10} style={[styles.anchor, { top: insets.top + 8 }]}>
        <Text style={styles.anchorDots}>⋯</Text>
        <Text style={styles.anchorLabel}>menú</Text>
      </Pressable>

      {open && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.menu, { top: insets.top + 52 }]}>
            {wired.map(it => (
              <Pressable key={it.id} onPress={it.onPress} style={styles.item}>
                <Text style={styles.itemText}>{it.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  anchorDots: { color: "#374151", fontSize: 22, lineHeight: 22, marginTop: -1 },
  anchorLabel: { color: "#111827", fontSize: 16, fontWeight: "600" },
  menu: {
    position: "absolute",
    right: 12,
    minWidth: 240,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  item: { paddingHorizontal: 12, paddingVertical: 10 },
  itemText: { fontSize: 16, color: "#111827" },
});
