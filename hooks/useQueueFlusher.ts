// hooks/useQueueFlusher.ts
import { useCallback, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { shift, peek, count, QueueJob } from "@/lib/queue";
import { supabase } from "@/lib/supabase";
import { isOnline } from "@/lib/net";
import { useToast } from "@/components/Toast";

/**
 * Intenta vaciar la cola cuando:
 * - la app vuelve a primer plano
 * - arrancamos el layout
 * - (opcional) puedes llamar manualmente a flush() tras login
 */
export function useQueueFlusher() {
  const toast = useToast();

  const processJob = useCallback(async (job: QueueJob) => {
    if (job.type === "create" && job.table === "pitches") {
      const { error } = await supabase.from("pitches").insert(job.payload);
      if (error) throw error;
    }
  }, []);

  const flush = useCallback(async () => {
    if (!isOnline()) return; // sin red: no hacemos nada
    // procesamos en FIFO; en caso de error, paramos para reintentar luego
    // (para no ciclar con un job quebrado)
    while (await count()) {
      const next = await peek();
      if (!next) break;
      try {
        await processJob(next);
        await shift(); // eliminado sólo si se procesó bien
      } catch (e) {
        // dejamos el job en cabeza para reintentar más tarde
        break;
      }
    }
  }, [processJob]);

  // al montar intentamos
  useEffect(() => {
    flush();
  }, [flush]);

  // cuando la app vuelve a primer plano
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s === "active") flush();
    });
    return () => sub.remove();
  }, [flush]);

  // feedback opcional
  useEffect(() => {
    (async () => {
      const n = await count();
      if (n > 0) toast.show(`Hay ${n} cambios pendientes por enviar…`);
    })();
  }, [toast]);

  return { flush };
}
