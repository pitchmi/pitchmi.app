// app.config.ts
import "dotenv/config";

const ANDROID_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const IOS_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY ?? "";

export default {
  expo: {
    name: "pitchmi",
    slug: "pitchmi",
    scheme: "pitchmi",
    owner: "pitchmi",

    // Plugins
    plugins: [
      "expo-router",
      "expo-apple-authentication",
      "./app.plugin.js", // inyecta las API keys en Android/iOS
    ],

    // iOS
    ios: {
      bundleIdentifier: "app.pitchmi",
      supportsTablet: true,
      // redundante pero OK: Expo también lo añade al Info.plist
      config: { googleMapsApiKey: IOS_MAPS_KEY },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          "Pitchmi usa tu ubicación para mostrarte planes cerca de ti.",
        NSPhotoLibraryUsageDescription:
          "Pitchmi necesita acceder a tu galería para subir imágenes.",
        NSCameraUsageDescription:
          "Pitchmi necesita acceso a la cámara para hacer fotos desde la app.",
      },
    },

    // Android
    android: {
      package: "app.pitchmi",
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
    },

    // Variables públicas (las toma de EAS env / .env.production)
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: ANDROID_MAPS_KEY,
      EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY: IOS_MAPS_KEY,
      EXPO_PUBLIC_POST_ID: process.env.EXPO_PUBLIC_POST_ID,
      eas: { projectId: "1fe051a9-1913-4082-8075-2323ed94b667" },
    },
  },
} as const;
