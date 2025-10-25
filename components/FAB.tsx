import { Pressable, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label?: string;
};

export default function FAB({ icon, onPress, label }: Props) {
  return (
    <View style={{ alignItems: "flex-end" }}>
      {label ? (
        <View style={{
          backgroundColor: "rgba(0,0,0,0.7)",
          paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, marginBottom: 6
        }}>
          <Text style={{ color: "#fff", fontSize: 12 }}>{label}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: pressed ? "#1f57d9" : "#2f6bff",
          alignItems: "center", justifyContent: "center",
          shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, elevation: 6
        })}
      >
        <Ionicons name={icon} size={26} color="#fff" />
      </Pressable>
    </View>
  );
}
