// app/(modals)/edit-profile.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { AVATARS, type AvatarKey } from "@/lib/avatars";
import AvatarPicker from "@/components/ui/AvatarPicker";

const C = "#3d4e5e";

type Profile = {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_key: AvatarKey | null;
};

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();

  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarKey, setAvatarKey] = useState<AvatarKey | null>(null);

  const avatarSrc = useMemo(
    () => AVATARS.find((a) => a.key === avatarKey)?.src,
    [avatarKey]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!session?.user?.id) return;
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, bio, avatar_key")
          .eq("id", session.user.id)
          .maybeSingle();
        if (error) throw error;

        if (mounted && data) {
          const p = data as Profile;
          setDisplayName(p.display_name ?? "");
          setBio(p.bio ?? "");
          setAvatarKey((p.avatar_key as AvatarKey | null) ?? null);
        }
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "No se pudo cargar tu perfil.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  const onCancel = () => router.back();

  const onSave = async () => {
    try {
      if (!session?.user?.id) {
        Alert.alert("Sesión requerida", "Inicia sesión para editar tu perfil.");
        return;
      }

      const name = displayName.trim();
      if (name.length < 2 || name.length > 40) {
        Alert.alert("Nombre inválido", "El nombre debe tener entre 2 y 40 caracteres.");
        return;
      }
      if (bio.length > 160) {
        Alert.alert("Bio demasiado larga", "Máximo 160 caracteres.");
        return;
      }

      setLoading(true);
      const payload: Partial<Profile> & { id: string } = {
        id: session.user.id,
        display_name: name,
        bio,
        avatar_key: (avatarKey as AvatarKey | null) ?? null,
      };

      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      if (error) throw error;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", e?.message ?? "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#eee",
        }}
      >
        <Pressable onPress={onCancel} style={{ padding: 8 }}>
          <Text style={{ color: C, fontWeight: "700" }}>Cancelar</Text>
        </Pressable>
        <Text style={{ color: C, fontWeight: "800" }}>Editar perfil</Text>
        <Pressable
          onPress={onSave}
          disabled={loading}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: loading ? "#cbd5e1" : "#2f6bff",
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>{loading ? "Guardando…" : "Guardar"}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 8, android: 0 })}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 108,
                height: 108,
                borderRadius: 54,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: "rgba(61,78,94,0.18)",
                backgroundColor: "rgba(61,78,94,0.06)",
              }}
            >
              {avatarSrc ? <Image source={avatarSrc} style={{ width: "100%", height: "100%" }} /> : null}
            </View>
            <Text style={{ marginTop: 8, color: C, opacity: 0.8, fontSize: 12 }}>
              Solo avatares predefinidos. Nada de fotos personales.
            </Text>
          </View>

          <Text style={{ color: C, fontWeight: "800", marginBottom: 8 }}>Avatar</Text>
          <AvatarPicker value={avatarKey} onChange={setAvatarKey} />

          <View style={{ height: 18 }} />
          <Text style={{ color: C, fontWeight: "800", marginBottom: 6 }}>Nombre</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Tu nombre"
            placeholderTextColor="#9ca3af"
            maxLength={40}
            autoCapitalize="words"
            style={{
              color: C,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: "#fff",
            }}
          />

          <View style={{ height: 18 }} />
          <Text style={{ color: C, fontWeight: "800", marginBottom: 6 }}>Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Algo corto sobre ti (máx. 160)"
            placeholderTextColor="#9ca3af"
            maxLength={160}
            multiline
            textAlignVertical="top"
            style={{
              color: C,
              minHeight: 100,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: "#fff",
            }}
          />

          <View style={{ height: 24 }} />

          <Pressable
            onPress={onSave}
            disabled={loading}
            style={{
              backgroundColor: loading ? "#cbd5e1" : "#2f6bff",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>{loading ? "Guardando…" : "Guardar cambios"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
