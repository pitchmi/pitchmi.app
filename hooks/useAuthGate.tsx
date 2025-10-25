import { useSession } from "@/lib/session";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const [email, setEmail] = useState("");

  if (loading) return <View style={s.center}><ActivityIndicator /></View>;
  if (!session) {
    const send = async () => {
      if (!email) return;
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) alert(error.message); else alert("Revisa tu correo.");
    };
    return (
      <View style={s.wrap}>
        <Text style={s.h}>Entrar</Text>
        <TextInput
          placeholder="tu@email.com" autoCapitalize="none" keyboardType="email-address"
          value={email} onChangeText={setEmail} style={s.input}
        />
        <Pressable style={s.btn} onPress={send}><Text style={s.bt}>Enviar enlace mágico</Text></Pressable>
      </View>
    );
  }
  return <>{children}</>;
}
const s=StyleSheet.create({
  center:{flex:1,justifyContent:"center",alignItems:"center"},
  wrap:{flex:1,justifyContent:"center",padding:24,gap:12},
  h:{fontSize:22,fontWeight:"700"},
  input:{borderWidth:1,borderColor:"#d0d7de",borderRadius:12,padding:12},
  btn:{backgroundColor:"#3d4e5e",padding:12,borderRadius:12,alignItems:"center"},
  bt:{color:"#fff",fontWeight:"600"}
});
