// lib/theme.tsx
import React, { createContext, useContext, useMemo } from "react";
import { Platform } from "react-native";

type Theme = {
  colors: {
    bg: string;
    text: string;
    primary: string;
    border: string;
    muted: string;
  };
  fonts: {
    serif: string;
    serifBold: string;
    serifItalic: string;
  };
};

const isIOS = Platform.OS === "ios";

export const baseTheme: Theme = {
  colors: {
    bg: "#f9fcfd",
    text: "#3d4e5e",
    primary: "#2563eb",
    border: "#e5e7eb",
    muted: "#6b7280",
  },
  fonts: {
    // iOS: Baskerville del sistema; Android: Libre Baskerville (cargada con expo-font)
    serif: isIOS ? "Baskerville" : "LibreBaskerville-Regular",
    serifBold: isIOS ? "Baskerville" : "LibreBaskerville-Bold",
    serifItalic: isIOS ? "Baskerville" : "LibreBaskerville-Italic",
  },
};

const ThemeCtx = createContext<Theme>(baseTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => baseTheme, []);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}
