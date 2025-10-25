export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export function assertEnv() {
  const miss = Object.entries(ENV).filter(([, v]) => !v).map(([k]) => k);
  if (miss.length) throw new Error(`Faltan ENV: ${miss.join(", ")}`);
}
