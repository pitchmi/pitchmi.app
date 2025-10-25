import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";

type ToastCtx = { show: (msg: string) => void };
const Ctx = createContext<ToastCtx>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  const show = (msg: string) => {
    setMessage(msg);
    Animated.timing(opacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(
      () => {
        setTimeout(() => {
          Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setMessage(null));
        }, 1400);
      }
    );
  };

  const value = useMemo(() => ({ show }), []);

  return (
    <Ctx.Provider value={value}>
      {children}
      {!!message && (
        <Animated.View pointerEvents="none" style={{ position: "absolute", left: 16, right: 16, bottom: 36, opacity }}>
          <View style={{ backgroundColor: "rgba(0,0,0,0.85)", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>{message}</Text>
          </View>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
