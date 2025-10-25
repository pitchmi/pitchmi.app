import { useInfiniteQuery } from "@tanstack/react-query";
import { listPitchesPage } from "@/services/pitches";

export function usePitchesInfinite() {
  return useInfiniteQuery({
    queryKey: ["pitches"],
    queryFn: ({ pageParam }) => listPitchesPage({ cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
  });
}
