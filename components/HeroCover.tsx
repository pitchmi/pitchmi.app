// components/HeroCover.tsx
import React from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  imageUrl?: string;               // ⬅️ opcional (string | undefined)
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

export default function HeroCover({ imageUrl, title, subtitle, onPress }: Props) {
  const hasImage = !!imageUrl;

  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      {hasImage ? (
        <ImageBackground source={{ uri: imageUrl! }} style={styles.img}>
          <LinearGradient
            colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.35)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.caption}>
            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </ImageBackground>
      ) : (
        <View style={[styles.img, styles.placeholder]}>
          <View style={{ gap: 6 }}>
            <View style={styles.line} />
            <View style={[styles.line, { width: "60%" }]} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  img: { height: 320, justifyContent: "flex-end" },
  placeholder: { backgroundColor: "#eef2f7", padding: 16, justifyContent: "flex-end" },
  caption: { padding: 16 },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 2 },
  },
  subtitle: { color: "white", opacity: 0.9, marginTop: 4 },
  line: { height: 10, width: "80%", backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 999 },
});
