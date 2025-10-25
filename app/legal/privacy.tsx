import { ScrollView, Text } from "react-native";

export default function Privacy() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "800" }}>Política de privacidad</Text>
      <Text style={{ color: "#475569", lineHeight: 22 }}>
        Aquí va la política de privacidad de Pitchmi…
      </Text>
    </ScrollView>
  );
}
