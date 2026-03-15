import { api } from "@/lib/axios";

export interface CropAdvisoryRecord {
  id: string;
  stage_name: string;
  activity: string;
  activity_type: string | null;
  activity_code: string | null;
  activity_time: string | null;
  start_day: number | null;
  end_day: number | null;
  specifications: Record<string, unknown> | null;
  steps: unknown[] | null;
  /** 1-based step order from API (current period). */
  step_index?: number;
  /** True if days_since_sowing falls in [start_day, end_day]. */
  is_current_period?: boolean;
}

export interface WeatherSummary {
  temperature_c: number | null;
  humidity: number | null;
  description: string | null;
  icon: string | null;
  raw?: any;
}

export interface PlotAdvisoriesResponse {
  days_since_sowing: number | null;
  advisories: CropAdvisoryRecord[];
  /** Optional compact weather summary for the plot. */
  weather?: WeatherSummary | null;
}

/** Tenant/agent: fetch advisories for a farmer's plot. */
export async function fetchPlotAdvisories(
  farmerId: string,
  plotId: string
): Promise<PlotAdvisoriesResponse> {
  const { data } = await api.get<PlotAdvisoriesResponse>(
    `/farmers/${farmerId}/plots/${plotId}/advisories`
  );
  return data;
}

