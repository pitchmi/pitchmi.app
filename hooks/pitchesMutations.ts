// hooks/pitchesMutations.ts — crear con fallback offline
import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { CategoryId } from "@/types/pitch";
import { useToast } from "@/components/Toast";
import { isOnline } from "@/lib/net";
import { enqueue } from "@/lib/queue";

export type CreateInput = {
  title: string;
  description?: string | null;
  image_url?: string | null;
  lat: number;
  lng: number;
  category?: CategoryId | null;
};

export function usePitchesMutations() {
  const toast = useToast();

  const createPitch = useCallback(
    async (input: CreateInput) => {
      const payload = {
        title: input.title,
        description: input.description ?? null,
        image_url: input.image_url ?? null,
        lat: input.lat,
        lng: input.lng,
        category: input.category ?? null,
      };

      // sin conexión → encola y avisa
      if (!isOnline()) {
        await enqueue({ type: "create", table: "pitches", payload });
        toast.show("Sin conexión: guardado en cola ✓");
        return { id: `temp-${Date.now()}` };
      }

      // con conexión → inserta en remoto
      const { data, error } = await supabase.from("pitches").insert(payload).select("id").single();
      if (error) throw error;
      toast.show("Publicación creada");
      return { id: data!.id as string };
    },
    [toast]
  );

  return { createPitch };
}
