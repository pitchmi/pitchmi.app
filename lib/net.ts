// lib/net.ts — timeout + retries + Retry-After
export type RetryOptions = { retries?: number; timeoutMs?: number; baseDelayMs?: number };

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function parseRetryAfter(h?: string | null): number | null {
  if (!h) return null;
  const asInt = parseInt(h, 10);
  if (!Number.isNaN(asInt)) return asInt * 1000; // segundos -> ms
  const asDate = Date.parse(h);
  if (!Number.isNaN(asDate)) return Math.max(asDate - Date.now(), 0);
  return null;
}

export async function fetchJSON<T = unknown>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  { retries = 2, timeoutMs = 8000, baseDelayMs = 300 }: RetryOptions = {}
): Promise<T> {
  let attempt = 0;
  let lastErr: any;
  while (attempt <= retries) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) {
        // Obedece Retry-After para 429/503
        if ((res.status === 429 || res.status === 503) && attempt < retries) {
          const ra = parseRetryAfter(res.headers.get("retry-after"));
          const backoff = ra ?? baseDelayMs * Math.pow(2, attempt);
          await sleep(backoff);
          attempt += 1;
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(id);
      lastErr = err;
      if (attempt === retries) break;
      const backoff = baseDelayMs * Math.pow(2, attempt);
      await sleep(backoff);
      attempt += 1;
    }
  }
  throw lastErr ?? new Error("Network error");
}

// Sencillo check de conectividad (evita añadir dependencias)
export async function isOnline(timeoutMs = 3000): Promise<boolean> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // ping ligero al proyecto de Supabase (HEAD si tu backend lo soporta)
    const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: "GET",
      signal: controller.signal,
    });
    return res.ok || res.status === 404; // nos vale cualquier respuesta del edge
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}
