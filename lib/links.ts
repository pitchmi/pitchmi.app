// lib/links.ts
import * as Linking from "expo-linking";

export type SearchParams = { q?: string; cat?: string };

/** Extrae { q, cat } de una URL si es ruta /search */
export function parseSearch(url: string): SearchParams | null {
  try {
    const { path, queryParams } = Linking.parse(url);
    if (!path || !/^\s*search\s*$/i.test(path)) return null;
    const q = typeof queryParams?.q === "string" ? queryParams.q : undefined;
    const cat = typeof queryParams?.cat === "string" ? queryParams.cat : undefined;
    return { q, cat };
  } catch {
    return null;
  }
}

/** Se suscribe a eventos de deep link y llama al callback con { q, cat } */
export function subscribeSearchLinks(cb: (p: SearchParams) => void) {
  const sub = Linking.addEventListener("url", (evt) => {
    const parsed = parseSearch(evt.url);
    if (parsed) cb(parsed);
  });

  // intenta con initialURL también
  (async () => {
    const initial = await Linking.getInitialURL();
    if (initial) {
      const parsed = parseSearch(initial);
      if (parsed) cb(parsed);
    }
  })();

  return () => sub.remove();
}
