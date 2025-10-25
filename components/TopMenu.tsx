import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const C = "#3d4e5e";

type Props = { onPress: () => void };

export default function TopMenu({ onPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.overlay, { paddingTop: insets.top }]}>
      <SafeAreaView edges={["top"]} pointerEvents="box-none">
        <Pressable onPress={onPress} hitSlop={10} style={styles.anchor} accessibilityLabel="Abrir menú">
          <Text style={styles.icon}>≡</Text>
          <Text style={styles.label}> Menú</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 50, alignItems: "flex-end" },
  anchor: { marginTop: 6, marginRight: 16, flexDirection: "row", alignItems: "center" },
  icon: { color: C, fontSize: 18, fontWeight: "700" },
  label: { color: C, fontSize: 18, fontWeight: "700" },
});
