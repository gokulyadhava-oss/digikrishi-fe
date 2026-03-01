import { useQuery } from "@tanstack/react-query";
import {
  fetchAnalyticsSummary,
  fetchByDistrict,
  fetchByAgent,
  fetchByFpc,
  fetchRationCardStats,
  fetchByVillage,
  fetchByTaluka,
  fetchByMonth,
} from "@/api/analytics";

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: fetchAnalyticsSummary,
  });
}

export function useAnalyticsByDistrict() {
  return useQuery({
    queryKey: ["analytics", "by-district"],
    queryFn: fetchByDistrict,
  });
}

export function useAnalyticsByAgent() {
  return useQuery({
    queryKey: ["analytics", "by-agent"],
    queryFn: fetchByAgent,
  });
}

export function useAnalyticsByFpc() {
  return useQuery({
    queryKey: ["analytics", "by-fpc"],
    queryFn: fetchByFpc,
  });
}

export function useAnalyticsRationCardStats() {
  return useQuery({
    queryKey: ["analytics", "ration-card-stats"],
    queryFn: fetchRationCardStats,
  });
}

export function useAnalyticsByVillage(limit = 15) {
  return useQuery({
    queryKey: ["analytics", "by-village", limit],
    queryFn: () => fetchByVillage(limit),
  });
}

export function useAnalyticsByTaluka(limit = 15) {
  return useQuery({
    queryKey: ["analytics", "by-taluka", limit],
    queryFn: () => fetchByTaluka(limit),
  });
}

export function useAnalyticsByMonth() {
  return useQuery({
    queryKey: ["analytics", "by-month"],
    queryFn: fetchByMonth,
  });
}
