// lib/fetcher.ts — SWR v2: config global + fetcher
import type { SWRConfiguration } from "swr";
import { fetchJSON } from "@/lib/net";

export async function swrFetcher<T>(key: string | [string, RequestInit?]) {
  if (Array.isArray(key)) {
    const [url, init] = key;
    return fetchJSON<T>(url, init);
  }
  return fetchJSON<T>(key);
}

export const defaultSWRConfig: SWRConfiguration = {
  fetcher: swrFetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 1500,
  focusThrottleInterval: 3000,

  // v2: numérico (en ms)
  errorRetryInterval: 2000,
  errorRetryCount: 3,

  shouldRetryOnError: (err) => {
    const msg = String(err ?? "");
    // no reintentar si es auth/404
    return !/HTTP\s(401|403|404)/.test(msg);
  },

  // Backoff exponencial manual (v2)
  onErrorRetry: (err, _key, _config, revalidate, opts) => {
    const msg = String(err ?? "");
    if (/HTTP\s(401|403|404)/.test(msg)) return;

    const timeout = Math.min(1000 * 2 ** (opts.retryCount ?? 0), 10_000);
    setTimeout(() => revalidate({ retryCount: (opts.retryCount ?? 0) + 1 }), timeout);
  },
};
