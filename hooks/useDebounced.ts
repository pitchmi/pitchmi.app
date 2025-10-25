// hooks/useDebounced.ts — hook de debounce genérico (TS)
// ==============================================
import { useMemo, useRef } from "react";

export function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, delay = 120) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useMemo(() => (
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    }
  ), [fn, delay]) as T;
}
