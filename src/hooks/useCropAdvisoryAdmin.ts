import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CropAdvisoryAdminRecord } from "@/api/crop-advisory-admin";
import * as advisoryApi from "@/api/crop-advisory-admin";
import { toast } from "@/lib/toast";

export function useCropAdvisoryTemplates() {
  return useQuery({
    queryKey: ["crop-advisory-templates"],
    queryFn: advisoryApi.fetchCropAdvisoryTemplates,
  });
}

export function useCropAdvisoryRecords(crop: string, season: string) {
  return useQuery({
    queryKey: ["crop-advisory-records", crop, season],
    queryFn: () => advisoryApi.fetchCropAdvisoryRecords(crop, season),
    enabled: !!crop && !!season,
  });
}

export function useGroupRecords(crop: string, season: string, varieties: string[]) {
  const key = [...varieties].sort().join(",");
  return useQuery({
    queryKey: ["crop-advisory-group", crop, season, key],
    queryFn: () => advisoryApi.fetchGroupRecords(crop, season, varieties),
    enabled: !!crop && !!season && varieties.length > 0,
  });
}

export function useCreateAdvisory(crop: string, season: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: advisoryApi.createAdvisory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crop-advisory-records", crop, season] });
      qc.invalidateQueries({ queryKey: ["crop-advisory-group", crop, season] });
      qc.invalidateQueries({ queryKey: ["crop-advisory-templates"] });
      toast.success("Activity created");
    },
    onError: () => toast.error("Failed to create activity"),
  });
}

export function useUpdateAdvisory(crop: string, season: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CropAdvisoryAdminRecord> }) =>
      advisoryApi.updateAdvisory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crop-advisory-records", crop, season] });
      qc.invalidateQueries({ queryKey: ["crop-advisory-group", crop, season] });
      toast.success("Activity updated");
    },
    onError: () => toast.error("Failed to update activity"),
  });
}

export function useDeleteAdvisory(crop: string, season: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: advisoryApi.deleteAdvisory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crop-advisory-records", crop, season] });
      qc.invalidateQueries({ queryKey: ["crop-advisory-group", crop, season] });
      qc.invalidateQueries({ queryKey: ["crop-advisory-templates"] });
      toast.success("Activity deleted");
    },
    onError: () => toast.error("Failed to delete activity"),
  });
}

export function useRegroupVariety(crop: string, season: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: advisoryApi.regroupVariety,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crop-advisory-records", crop, season] });
      qc.invalidateQueries({ queryKey: ["crop-advisory-templates"] });
      toast.success("Variety moved");
    },
    onError: () => toast.error("Failed to move variety"),
  });
}

export function useCopyPop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: advisoryApi.copyPop,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["crop-advisory-templates"] });
      toast.success(`${data.created} activities copied as draft`);
    },
    onError: () => toast.error("Failed to copy POP"),
  });
}

export function usePublishGroup(crop: string, season: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ varieties }: { varieties: string[] }) =>
      advisoryApi.publishGroup(crop, season, varieties),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["crop-advisory-records", crop, season] });
      qc.invalidateQueries({ queryKey: ["crop-advisory-group", crop, season] });
      qc.invalidateQueries({ queryKey: ["crop-advisory-templates"] });
      toast.success(`${data.updated} activities published`);
    },
    onError: () => toast.error("Failed to publish"),
  });
}
