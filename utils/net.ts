import NetInfo from "@react-native-community/netinfo";

export async function isOnline() {
  const s = await NetInfo.fetch();
  return !!s.isConnected;
}
