import { useEffect, useMemo } from "react";
import { Stack, router } from "expo-router";
import { useSession } from "@/lib/session";

function useIsAdmin(session: any) {
  return useMemo(() => {
    const u = session?.user;
    return (
      u?.app_metadata?.role === "admin" ||
      u?.user_metadata?.role === "admin" ||
      u?.role === "admin"
    );
  }, [session]);
}

export default function AdminLayout() {
  const { session } = useSession();
  const isAdmin = useIsAdmin(session);

  useEffect(() => {
    if (isAdmin === false) {
      router.replace("/(tabs)");
    }
  }, [isAdmin]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="reports" />
    </Stack>
  );
}
