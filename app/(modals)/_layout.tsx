// app/(modals)/_layout.tsx
// ===============================
import { Stack } from "expo-router";
export default function ModalGroupLayout() {
  return <Stack screenOptions={{ headerShown: false, presentation: "modal", gestureEnabled: true, fullScreenGestureEnabled: true }} />;
}
