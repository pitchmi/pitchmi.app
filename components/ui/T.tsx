// components/ui/T.tsx
import React from "react";
import { Text, TextProps } from "react-native";
import { useTheme } from "@/lib/theme";

export default function T(props: TextProps) {
  const theme = useTheme();
  const { style, ...rest } = props;
  return (
    <Text
      {...rest}
      style={[
        {
          color: theme.colors.text,
          fontFamily: theme.fonts.serif,
        },
        style,
      ]}
    />
  );
}
