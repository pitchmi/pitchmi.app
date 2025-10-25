// components/ui/V.tsx
import React from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "@/lib/theme";

export default function V(props: ViewProps) {
  const theme = useTheme();
  const { style, ...rest } = props;
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.colors.bg,
        },
        style,
      ]}
    />
  );
}
