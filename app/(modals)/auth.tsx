// app/(modals)/auth.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

const C = "#3d4e5e";
const BLUE = "#2F6BFF";

export default function AuthModal() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const goAccount = () => r.replace("/account");

  const signin = async () => {
    setErr(null); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    goAccount(); // ← ir al perfil
  };

  const signup = async () => {
    setErr(null); setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    goAccount(); // ← ir al perfil (si tu proyecto exige verificación por email, el perfil mostrará el gate)
  };

  return (
    <View style={{ flex:1, backgroundColor:"#f9fcfd", padding:16, justifyContent:"center" }}>
      <Text style={{ color:C, fontSize:20, fontWeight:"900", marginBottom:12 }}>Accede a tu cuenta</Text>

      <TextInput
        placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}
        style={{ borderWidth:1, borderColor:"#e5e7eb", backgroundColor:"#fff", paddingHorizontal:12, paddingVertical:10, borderRadius:12, marginBottom:8, color:C }}
      />
      <TextInput
        placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword}
        style={{ borderWidth:1, borderColor:"#e5e7eb", backgroundColor:"#fff", paddingHorizontal:12, paddingVertical:10, borderRadius:12, marginBottom:8, color:C }}
      />

      {err ? <Text style={{ color:"#e33d5b", marginBottom:8 }}>{err}</Text> : null}

      <View style={{ flexDirection:"row", gap:10 }}>
        <Pressable onPress={signin} style={{ flex:1, paddingVertical:12, borderRadius:12, backgroundColor:BLUE, alignItems:"center" }}>
          <Text style={{ color:"#fff", fontWeight:"900" }}>{busy ? "Entrando…" : "Entrar"}</Text>
        </Pressable>
        <Pressable onPress={signup} style={{ flex:1, paddingVertical:12, borderRadius:12, borderWidth:1, borderColor:"#e5e7eb", backgroundColor:"#fff", alignItems:"center" }}>
          <Text style={{ color:C, fontWeight:"800" }}>{busy ? "Creando…" : "Crear cuenta"}</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => r.dismiss()} style={{ marginTop:14, alignItems:"center" }}>
        <Text style={{ color:C, fontWeight:"700" }}>Cerrar</Text>
      </Pressable>
    </View>
  );
}
