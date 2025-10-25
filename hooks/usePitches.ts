import useSWR from "swr";
import type { Pitch, CategoryId } from "@/types/pitch";
import { fetchPitches } from "@/lib/pitches";
import { savePitchesCache } from "@/lib/cache";

type KeyTuple = ["/pitches", CategoryId | "all" | null, string, number, number];

export function usePitches(
  category: CategoryId | null,
  query: string,
  page: number,
  pageSize = 200
) {
  const key: KeyTuple = ["/pitches", category ?? "all", query ?? "", page, pageSize];

  const { data, error, isLoading, isValidating, mutate } = useSWR<Pitch[], any, KeyTuple>(
    key,
    ([, cat, q, p, s]) => fetchPitches(cat === "all" ? null : (cat as CategoryId | null), q, p, s),
    {
      onSuccess: (rows) => savePitchesCache(rows).catch(() => {}),
      revalidateOnFocus: true,
    }
  );

  return { data: data ?? [], error, isLoading, isValidating, mutate };
}
