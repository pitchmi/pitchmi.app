import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
if (!SPOTIFY_CLIENT_ID) console.warn("EXPO_PUBLIC_SPOTIFY_CLIENT_ID no definido");

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

const USE_PROXY = Constants.appOwnership === "expo";

// TS de tu versión no conoce `useProxy`; forzamos tipo
const makeRedirectUriAny = AuthSession.makeRedirectUri as unknown as (opts: any) => string;
const REDIRECT_URI = makeRedirectUriAny({
  scheme: "pitchmi",
  path: "oauthredirect",
  useProxy: USE_PROXY,
});

export type SimpleTrack = {
  id: string;
  name: string;
  artist: string;
  image: string | null;
  previewUrl: string | null;
  url: string;
};

export async function connectSpotify(): Promise<string> {
  if (!SPOTIFY_CLIENT_ID) throw new Error("EXPO_PUBLIC_SPOTIFY_CLIENT_ID no está configurado");

  const req = new AuthSession.AuthRequest({
    clientId: SPOTIFY_CLIENT_ID,
    scopes: ["user-top-read"],
    redirectUri: REDIRECT_URI,
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
  });

  await req.makeAuthUrlAsync(discovery);

  // TS tampoco tipa `useProxy` aquí; castear el segundo argumento
  const promptOpts: any = USE_PROXY ? { useProxy: true } : {};
  const res = await req.promptAsync(discovery, promptOpts);
  if (res.type !== "success" || !res.params.code) throw new Error("Autenticación cancelada");

  const tokenRes = await AuthSession.exchangeCodeAsync(
    {
      clientId: SPOTIFY_CLIENT_ID,
      code: res.params.code,
      redirectUri: REDIRECT_URI,
      extraParams: { code_verifier: req.codeVerifier as string },
    },
    discovery
  );

  if (!tokenRes.accessToken) throw new Error("Sin token de acceso");
  return tokenRes.accessToken;
}

export async function fetchTopTracks(accessToken: string): Promise<SimpleTrack[]> {
  const r = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error("No se pudieron cargar tus top tracks");
  const json = await r.json();

  return (json.items ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    artist: (t.artists ?? []).map((a: any) => a.name).join(", "),
    image: t.album?.images?.[1]?.url ?? t.album?.images?.[0]?.url ?? null,
    previewUrl: t.preview_url ?? null,
    url: t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
  }));
}

export function disconnectSpotify() {}
