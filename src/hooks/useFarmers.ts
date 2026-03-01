import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { fetchFarmers, assignFarmerToAgent } from "@/api/farmers";
import { paginationAtom, farmerListFiltersAtom, farmerListSortAtom } from "@/atoms";

export function useFarmers() {
  const pagination = useAtomValue(paginationAtom);
  const listFilters = useAtomValue(farmerListFiltersAtom);
  const listSort = useAtomValue(farmerListSortAtom);
  return useQuery({
    queryKey: ["farmers", pagination.page, pagination.limit, listFilters, listSort],
    queryFn: () => fetchFarmers({ ...pagination, filters: listFilters, sort: listSort }),
  });
}

/** Farmers list for dropdowns (e.g. assign to field officer). */
export function useFarmersForAssign(limit = 200) {
  return useQuery({
    queryKey: ["farmers", "assign", 1, limit],
    queryFn: () => fetchFarmers({ page: 1, limit }),
  });
}

export function useAssignFarmerToAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ farmerId, agentId }: { farmerId: string; agentId: string | null }) =>
      assignFarmerToAgent(farmerId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
    },
  });
}
