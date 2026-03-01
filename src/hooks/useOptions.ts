import { useQuery } from "@tanstack/react-query";
import { fetchFpcList, fetchShgList } from "@/api/options";

export function useFpcList(enabled = true) {
  return useQuery({
    queryKey: ["options", "fpc"],
    queryFn: fetchFpcList,
    enabled,
  });
}

export function useShgList(fpc: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["options", "shg", fpc ?? ""],
    queryFn: () => fetchShgList(fpc),
    enabled,
  });
}
