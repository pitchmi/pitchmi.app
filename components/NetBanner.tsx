import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";

export default function NetBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sub = NetInfo.addEventListener(s => setOffline(!s.isConnected));
    return () => sub();
  }, []);
  if (!offline) return null;
  return (
    <View style={{ position:"absolute", top:0, left:0, right:0, backgroundColor:"#111827", paddingVertical:6, alignItems:"center" }}>
      <Text style={{ color:"#fff", fontWeight:"600" }}>Sin conexión. Mostrando datos en caché.</Text>
    </View>
  );
}
