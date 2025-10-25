// components/CategoryPicker.tsx
import { ScrollView, Pressable, Text, View } from "react-native";
import { CATEGORIES, Category } from "@/lib/categories";

export default function CategoryPicker({
  value, onChange,
}: { value: Category | null; onChange: (c: Category | null) => void }) {
  return (
    <View style={{ marginTop: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
        <Chip label="Todas" active={!value} onPress={() => onChange(null)} />
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} active={value === c} onPress={() => onChange(c)} />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
        borderWidth: 1, borderColor: active ? "#2f6bff" : "#d0d7de",
        backgroundColor: active ? "#eaf2ff" : "#fff",
      }}
    >
      <Text style={{ fontWeight: "700", color: active ? "#2f6bff" : "#111827" }}>{label}</Text>
    </Pressable>
  );
}
