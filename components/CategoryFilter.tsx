import React from "react";
import { ScrollView, Pressable, Text, View } from "react-native";

type Props = {
  options?: string[];          // opcional
  value?: string | null;       // opcional
  onChange?: (v: string | null) => void; // opcional
};

export default function CategoryFilter(props: Props) {
  const opts = Array.isArray(props.options) ? props.options : [];
  const val = props.value ?? null;
  const change = props.onChange ?? (() => {});

  return (
    <View style={{ marginTop: 8 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
      >
        <Chip label="Todas" active={val === null} onPress={() => change(null)} />
        {opts.map((c) => (
          <Chip key={c} label={c} active={val === c} onPress={() => change(c)} />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? "#2f6bff" : "#d0d7de",
        backgroundColor: active ? "#eaf2ff" : "#fff",
      }}
    >
      <Text style={{ fontWeight: "700", color: active ? "#2f6bff" : "#111827" }}>
        {label}
      </Text>
    </Pressable>
  );
}
