import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { searchFarmers } from "@/api/search";
import { searchQueryAtom, paginationAtom } from "@/atoms";
import { useDebouncedValue } from "./useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 300;

export function useSearchFarmers() {
  const query = useAtomValue(searchQueryAtom);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const pagination = useAtomValue(paginationAtom);
  return useQuery({
    queryKey: ["search", debouncedQuery, pagination.page, pagination.limit],
    queryFn: () => searchFarmers(debouncedQuery.trim(), pagination.page, pagination.limit),
    enabled: debouncedQuery.trim().length > 0,
  });
}
