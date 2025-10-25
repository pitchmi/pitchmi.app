import React, { useState } from "react";
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator, Platform, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [loading, setLoading] = useState<null | "google" | "apple">(null);

  const signInGoogle = async () => {
    try {
      setLoading("google");
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.EXPO_PUBLIC_SCHEME ?? "pitchmi"}://auth/callback`,
          skipBrowserRedirect: false,
        },
      });
      if (error) throw error;
      // Supabase se encarga del deep link → vuelve a la app con la sesión
    } catch (e: any) {
      alert(e?.message ?? "No se pudo iniciar sesión con Google.");
    } finally {
      setLoading(null);
    }
  };

  const signInApple = async () => {
    try {
      setLoading("apple");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${process.env.EXPO_PUBLIC_SCHEME ?? "pitchmi"}://auth/callback`,
          skipBrowserRedirect: false,
        },
      });
      if (error) throw error;
    } catch (e: any) {
      alert(e?.message ?? "No se pudo iniciar sesión con Apple.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#a5b4fc", "#c7d2fe", "#dbeafe"]} // hielo / lavanda
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Text style={styles.brand}>pitchmi.</Text>
        <Text style={styles.tag}>Tu mapa del ahora</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Accede para publicar y guardar tu portafolio</Text>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={signInGoogle}
          disabled={!!loading}
          style={[styles.btn, { backgroundColor: "#fff", borderColor: "#e5e7eb", borderWidth: 1 }]}
        >
          {loading === "google" ? (
            <ActivityIndicator />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color="#111827" />
              <Text style={[styles.btnText, { color: "#111827" }]}>Continuar con Google</Text>
            </>
          )}
        </TouchableOpacity>

        {Platform.OS !== "android" && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={signInApple}
            disabled={!!loading}
            style={[styles.btn, { backgroundColor: "#111827" }]}
          >
            {loading === "apple" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text style={[styles.btnText, { color: "#fff" }]}>Continuar con Apple</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 14, alignSelf: "center" }}>
          <Text style={{ color: "#475569" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { position: "absolute", top: 80, alignItems: "center" },
  brand: { fontSize: 36, fontWeight: "800", color: "#0f172a" },
  tag: { marginTop: 4, color: "#334155" },
  card: {
    width: "88%",
    maxWidth: 420,
    borderRadius: 20,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3,
  },
  title: { fontSize: 16, color: "#0f172a", marginBottom: 14, textAlign: "center" },
  btn: {
    height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 10, marginTop: 10,
  },
  btnText: { fontWeight: "800" },
});
