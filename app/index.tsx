import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Hola Pitchmi 👋</Text>
      <StatusBar style="auto" />
    </View>
  );
}
