import { api } from "@/lib/axios";

export interface CropAdvisoryAdminRecord {
  id: string;
  tenant_id: string;
  crop: string;
  season: string;
  varieties: string[];
  stage_name: string;
  activity: string;
  activity_type: string | null;
  activity_code: "Mandatory" | "Optional" | null;
  activity_time: string | null;
  start_day: number | null;
  end_day: number | null;
  specifications: Record<string, unknown> | string[] | null;
  steps: unknown[] | null;
  locale: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VarietyGroup {
  varieties: string[];
  total: number;
  active: number;
}

export interface CropAdvisoryTemplate {
  crop: string;
  season: string;
  variety_groups: VarietyGroup[];
  total_groups: number;
}

export async function fetchCropAdvisoryTemplates(): Promise<CropAdvisoryTemplate[]> {
  const { data } = await api.get<CropAdvisoryTemplate[]>("/crop-advisory/templates");
  return data;
}

export async function fetchCropAdvisoryRecords(
  crop: string,
  season: string
): Promise<{ records: CropAdvisoryAdminRecord[]; total: number }> {
  const { data } = await api.get("/crop-advisory", { params: { crop, season } });
  return data;
}

export async function fetchGroupRecords(
  crop: string,
  season: string,
  varieties: string[]
): Promise<CropAdvisoryAdminRecord[]> {
  const { data } = await api.get<CropAdvisoryAdminRecord[]>(
    `/crop-advisory/group/${encodeURIComponent(crop)}/${encodeURIComponent(season)}`,
    { params: { varieties: varieties.join(",") } }
  );
  return data;
}

export async function createAdvisory(
  data: Omit<CropAdvisoryAdminRecord, "id" | "tenant_id" | "created_at" | "updated_at">
): Promise<CropAdvisoryAdminRecord> {
  const { data: result } = await api.post<CropAdvisoryAdminRecord>("/crop-advisory", data);
  return result;
}

export async function updateAdvisory(
  id: string,
  data: Partial<CropAdvisoryAdminRecord>
): Promise<CropAdvisoryAdminRecord> {
  const { data: result } = await api.put<CropAdvisoryAdminRecord>(`/crop-advisory/${id}`, data);
  return result;
}

export async function deleteAdvisory(id: string): Promise<{ ok: boolean }> {
  const { data } = await api.delete<{ ok: boolean }>(`/crop-advisory/${id}`);
  return data;
}

export async function regroupVariety(body: {
  crop: string;
  season: string;
  fromVarieties: string[];
  movedVariety: string;
  toVarieties: string[];
}): Promise<{ ok: boolean }> {
  const { data } = await api.post("/crop-advisory/regroup", body);
  return data;
}

export async function copyPop(body: {
  sourceCrop: string;
  sourceSeason: string;
  sourceVarieties: string[];
  targetCrop: string;
  targetSeason: string;
  targetVarieties: string[];
  stageFilter?: string[];
}): Promise<{ created: number; draft: boolean }> {
  const { data } = await api.post("/crop-advisory/copy", body);
  return data;
}

export async function publishGroup(
  crop: string,
  season: string,
  varieties: string[]
): Promise<{ updated: number }> {
  const { data } = await api.post(
    `/crop-advisory/publish/${encodeURIComponent(crop)}/${encodeURIComponent(season)}`,
    { varieties }
  );
  return data;
}
