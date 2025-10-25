// lib/auth.ts
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

/* ========== Helpers comunes ========== */
function randomString(len = 32) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/* ========== Apple Sign-In ========== */
export async function isAppleAvailable() {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signInWithApple() {
  const available = await isAppleAvailable();
  if (!available) throw new Error("Apple Sign-In no está disponible en este dispositivo/build.");

  const rawNonce = randomString(32);
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce, // iOS recibe el hash
  });

  if (!credential.identityToken) throw new Error("No se recibió identityToken de Apple.");

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
    nonce: rawNonce, // Supabase valida contra el hash que enviamos a iOS
  });
  if (error) throw error;
  return data.session ?? null;
}

/* ========== Email + Password ========== */
export async function signUpEmail(email: string, password: string) {
  const e = email.trim();
  if (!e || !password) throw new Error("Email y contraseña son obligatorios.");
  const { data, error } = await supabase.auth.signUp({
    email: e,
    password,
    options: { emailRedirectTo: undefined },
  });
  if (error) throw error;
  return data;
}

export async function signInEmail(email: string, password: string) {
  const e = email.trim();
  if (!e || !password) throw new Error("Email y contraseña son obligatorios.");
  const { data, error } = await supabase.auth.signInWithPassword({ email: e, password });
  if (error) throw error;
  return data;
}

export async function sendResetPassword(email: string) {
  const e = email.trim();
  if (!e) throw new Error("Ingresa tu email.");
  const { data, error } = await supabase.auth.resetPasswordForEmail(e, {
    redirectTo: undefined,
  });
  if (error) throw error;
  return data;
}

/* ========== Google Sign-In (AuthSession → Supabase OIDC) ========== */
const googleDiscovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export async function signInWithGoogle() {
  // ClientId según plataforma (usa los que pusiste en app.json -> extra)
  const expoId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID!;
  const iosId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID!;
  const androidId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID!;

  const clientId = Platform.select({
    ios: iosId,
    android: androidId,
    default: expoId, // Expo Go/dev
  }) as string;

  if (!clientId) throw new Error("Falta configurar los Client IDs de Google.");

  const redirectUri = AuthSession.makeRedirectUri({ scheme: "pitchmi" });

  const rawNonce = randomString(32);
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ["openid", "profile", "email"],
    extraParams: { nonce: hashedNonce },
  });

  await request.makeAuthUrlAsync(googleDiscovery);
  const result = await request.promptAsync(googleDiscovery);

  if (result.type !== "success" || !result.params?.id_token) {
    throw new Error("Inicio de sesión cancelado o sin token.");
  }

  const idToken = result.params.id_token as string;

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    nonce: rawNonce,
  });
  if (error) throw error;
  return data.session ?? null;
}

/* ========== Sign out ========== */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
