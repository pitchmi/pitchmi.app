// app.config.ts
import "dotenv/config";

export default {
  expo: {
    name: "pitchmi",
    slug: "pitchmi",
    scheme: "pitchmi",
    owner: "pitchmi",
    plugins: ["expo-router", "expo-apple-authentication"],
    ios: {
      bundleIdentifier: "app.pitchmi",
      infoPlist: { ITSAppUsesNonExemptEncryption: false }
    },
    android: { package: "app.pitchmi" },
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_POST_ID: process.env.EXPO_PUBLIC_POST_ID,
      eas: { projectId: "1fe051a9-1913-4082-8075-2323ed94b667" }
    }
  }
};
