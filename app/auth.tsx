// app/auth.tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  signInEmail, signUpEmail, sendResetPassword, signInWithGoogle,
  signInWithApple, isAppleAvailable,
} from "@/lib/auth";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

const C = "#3d4e5e";

export default function AuthScreen() {
  const { session } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [appleEnabled, setAppleEnabled] = useState(false);

  // si hay sesión → perfil
  useEffect(() => { if (session) router.replace("/account"); }, [session]);
  useEffect(() => { (async () => setAppleEnabled(await isAppleAvailable()))(); }, []);

  const onSubmitEmail = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Campos incompletos", "Email y contraseña son obligatorios.");
      return;
    }
    try {
      setLoading(true);
      if (mode === "signin") {
        await signInEmail(email.trim(), password);
        router.replace("/account");
        return;
      }
      // signup
      await signUpEmail(email.trim(), password);
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        Alert.alert("Confirma tu correo", "Hemos enviado un enlace de verificación.");
        return; // el efecto de sesión redirige cuando se confirme
      }
      router.replace("/account");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo completar la acción.");
    } finally {
      setLoading(false);
    }
  };

  const onReset = async () => {
    if (!email.trim()) { Alert.alert("Ingresa tu email", "Te enviaremos un enlace de recuperación."); return; }
    try { setLoading(true); await sendResetPassword(email.trim()); Alert.alert("Enviado", "Revisa tu correo para restablecer tu contraseña."); }
    catch (e: any) { Alert.alert("Error", e?.message ?? "No se pudo enviar el correo."); }
    finally { setLoading(false); }
  };

  const onGoogle = async () => {
    try { setLoading(true); await signInWithGoogle(); router.replace("/account"); }
    catch (e:any){ Alert.alert("Google", e?.message ?? "No se pudo iniciar sesión con Google."); }
    finally { setLoading(false); }
  };

  const onApple = async () => {
    try { setLoading(true); await signInWithApple(); router.replace("/account"); }
    catch (e:any){ Alert.alert("Apple", e?.message ?? "No se pudo iniciar sesión con Apple."); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.container}>
        <Text style={s.title}>{mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}</Text>

        <Text style={s.label}>Email</Text>
        <TextInput
          autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}
          placeholder="tucorreo@dominio.com" style={s.input} editable={!loading}
        />

        <Text style={s.label}>Contraseña</Text>
        <TextInput
          value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry
          style={s.input} editable={!loading}
        />

        <Pressable style={[s.btn, loading && s.btnDisabled]} onPress={onSubmitEmail} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={s.btnText}>{mode === "signin" ? "Entrar" : "Crear cuenta"}</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode(mode === "signin" ? "signup" : "signin")} disabled={loading} style={{ marginTop: 12 }}>
          <Text style={s.link}>
            {mode === "signin" ? "¿No tienes cuenta? Crear una" : "¿Ya tienes cuenta? Inicia sesión"}
          </Text>
        </Pressable>

        {mode === "signin" && (
          <Pressable onPress={onReset} disabled={loading} style={{ marginTop: 8 }}>
            <Text style={[s.link, { opacity: 0.85 }]}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
        )}

        <View style={s.dividerArea}>
          <View style={s.divider} />
          <Text style={s.dividerText}>o</Text>
          <View style={s.divider} />
        </View>

        <Pressable onPress={onGoogle} disabled={loading} style={[s.btn, { backgroundColor: "#2563eb" }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Continuar con Google</Text>}
        </Pressable>

        {appleEnabled && (
          <View style={{ marginTop: 10 }}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={10}
              style={{ width: "100%", height: 44 }}
              onPress={onApple}
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 10, backgroundColor: "#fff", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 8, textAlign: "center", color: C },
  label: { fontSize: 14, opacity: 0.9, color: C },
  input: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: "#fff", color: C,
  },
  btn: { marginTop: 10, backgroundColor: "#111827", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { color: "#2563eb", fontWeight: "700", textAlign: "center" },
  dividerArea: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 14 },
  divider: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerText: { color: "#6b7280", fontWeight: "700" },
});
