import AsyncStorage from "@react-native-async-storage/async-storage";
import { Modal, View, Text, Pressable, Linking, StyleSheet } from "react-native";
import { useEffect, useState } from "react";

const KEY = "consentAcceptedV1";

export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => setShow(v !== "1"));
  }, []);

  const accept = async () => { await AsyncStorage.setItem(KEY, "1"); setShow(false); };

  return (
    <>
      {children}
      <Modal visible={show} animationType="slide" transparent>
        <View style={s.wrap}>
          <View style={s.card}>
            <Text style={s.h}>Términos y privacidad</Text>
            <Text style={s.p}>Al continuar aceptas nuestros términos y la política de privacidad.</Text>
            <View style={s.row}>
              <Pressable onPress={() => Linking.openURL("https://tu-dominio/terminos")}><Text style={s.link}>Ver términos</Text></Pressable>
              <Pressable onPress={() => Linking.openURL("https://tu-dominio/privacidad")}><Text style={s.link}>Privacidad</Text></Pressable>
            </View>
            <Pressable style={s.btn} onPress={accept}><Text style={s.bt}>Aceptar</Text></Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
const s = StyleSheet.create({
  wrap:{flex:1,backgroundColor:"rgba(0,0,0,0.3)",justifyContent:"center",alignItems:"center"},
  card:{width:"88%",backgroundColor:"#fff",borderRadius:16,padding:20},
  h:{fontSize:20,fontWeight:"600",marginBottom:8},
  p:{fontSize:14,color:"#3d4e5e"},
  row:{flexDirection:"row",gap:16,marginTop:8},
  link:{textDecorationLine:"underline"},
  btn:{marginTop:16,backgroundColor:"#3d4e5e",padding:12,borderRadius:12,alignItems:"center"},
  bt:{color:"#fff",fontWeight:"600"}
});
