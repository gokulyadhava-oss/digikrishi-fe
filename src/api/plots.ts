import { api } from "@/lib/axios";

/**
 * Plot coordinate data
 */
export interface PlotCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * GPS path point with accuracy and timestamp
 */
export interface GpsPathPoint {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

/**
 * Plot map record - represents a recorded GPS boundary
 */
export interface PlotMapRecord {
  id: string;
  plot_id: string;
  name: string;
  coordinates: PlotCoordinate[];
  gps_path?: GpsPathPoint[];
  drawing?: any; // Manual drawing strokes if applicable
  area_m2: number;
  area_acres: number;
  area_hectares: number;
  value?: number | null;
  currency?: string;
  created_at?: string;
}

/**
 * Farmer plot details (legacy / with plot_maps)
 */
export interface FarmerPlot {
  id: string;
  farmer_id: string;
  name?: string;
  village?: string;
  taluka?: string;
  district?: string;
  soil_type?: string;
  crop?: string;
  created_at?: string;
  updated_at?: string;
  plot_maps?: PlotMapRecord[];
}

/**
 * Farmer plot/crop-land record (API response from GET /farmers/:id/plots)
 */
export interface FarmerPlotRecord {
  id: string;
  farmer_id: string;
  season: string;
  variety: string;
  sowing_date: string;
  units: string;
  land_size_value: string;
  sowing_method: string;
  planting_material: string | null;
  farming_type: string;
  irrigation_method: string;
  address: string | null;
  pincode: string | null;
  taluka: string | null;
  district: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all plots (crop/land records) for a specific farmer
 * @param farmerId - The farmer ID
 * @returns Array of FarmerPlotRecord objects
 */
export async function fetchFarmerPlots(farmerId: string): Promise<FarmerPlotRecord[]> {
  try {
    const { data } = await api.get<FarmerPlotRecord[]>(`/farmers/${farmerId}/plots`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching plots for farmer ${farmerId}:`, error);
    throw error;
  }
}

/**
 * Fetch a specific plot with all its details and maps
 * @param farmerId - The farmer ID
 * @param plotId - The plot ID
 * @returns FarmerPlot object with plot maps
 */
export async function fetchFarmerPlot(farmerId: string, plotId: string): Promise<FarmerPlot | null> {
  try {
    const { data } = await api.get<FarmerPlot>(`/farmers/${farmerId}/plots/${plotId}`);
    return data || null;
  } catch (error) {
    console.error(`Error fetching plot ${plotId} for farmer ${farmerId}:`, error);
    throw error;
  }
}

/**
 * Fetch all plot maps (GPS recordings) for a specific plot.
 * Uses same endpoint as mobile app: GET /farms?plot_id=uuid
 * @param _farmerId - Unused (backend uses tenant from auth)
 * @param plotId - The plot ID
 * @returns Array of PlotMapRecord objects
 */
export async function fetchPlotMaps(_farmerId: string, plotId: string): Promise<PlotMapRecord[]> {
  try {
    const { data } = await api.get<PlotMapRecord[]>(`/farms`, {
      params: { plot_id: plotId },
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching maps for plot ${plotId}:`, error);
    throw error;
  }
}

/**
 * Fetch a specific plot map/recording (full: includes gps_path, drawing).
 * Same as backend: GET /farms/:id
 * @param _farmerId - Unused
 * @param _plotId - Unused
 * @param mapId - The plot map ID
 * @returns PlotMapRecord object
 */
export async function fetchPlotMap(
  _farmerId: string,
  _plotId: string,
  mapId: string
): Promise<PlotMapRecord | null> {
  try {
    const { data } = await api.get<PlotMapRecord>(`/farms/${mapId}`);
    return data || null;
  } catch (error) {
    console.error(`Error fetching map ${mapId}:`, error);
    throw error;
  }
}

/**
 * Create a new plot for a farmer
 * @param farmerId - The farmer ID
 * @param payload - Plot data to create
 * @returns Created FarmerPlot object
 */
export async function createPlot(
  farmerId: string,
  payload: Partial<FarmerPlot>
): Promise<FarmerPlot> {
  try {
    const { data } = await api.post<FarmerPlot>(`/farmers/${farmerId}/plots`, payload);
    return data;
  } catch (error) {
    console.error(`Error creating plot for farmer ${farmerId}:`, error);
    throw error;
  }
}

/**
 * Update an existing plot
 * @param farmerId - The farmer ID
 * @param plotId - The plot ID
 * @param payload - Plot data to update
 * @returns Updated FarmerPlot object
 */
export async function updatePlot(
  farmerId: string,
  plotId: string,
  payload: Partial<FarmerPlot>
): Promise<FarmerPlot> {
  try {
    const { data } = await api.put<FarmerPlot>(
      `/farmers/${farmerId}/plots/${plotId}`,
      payload
    );
    return data;
  } catch (error) {
    console.error(`Error updating plot ${plotId}:`, error);
    throw error;
  }
}

/**
 * Delete a plot
 * @param farmerId - The farmer ID
 * @param plotId - The plot ID
 * @returns Success response
 */
export async function deletePlot(farmerId: string, plotId: string): Promise<{ message: string }> {
  try {
    const { data } = await api.delete<{ message: string }>(
      `/farmers/${farmerId}/plots/${plotId}`
    );
    return data;
  } catch (error) {
    console.error(`Error deleting plot ${plotId}:`, error);
    throw error;
  }
}

/**
 * Save a new plot map/recording
 * @param farmerId - The farmer ID
 * @param plotId - The plot ID
 * @param payload - Plot map data to save
 * @returns Created PlotMapRecord
 */
export async function savePlotMap(
  farmerId: string,
  plotId: string,
  payload: Partial<PlotMapRecord>
): Promise<PlotMapRecord> {
  try {
    const { data } = await api.post<PlotMapRecord>(
      `/farmers/${farmerId}/plots/${plotId}/maps`,
      payload
    );
    return data;
  } catch (error) {
    console.error(`Error saving plot map:`, error);
    throw error;
  }
}

/**
 * Update an existing plot map
 * @param farmerId - The farmer ID
 * @param plotId - The plot ID
 * @param mapId - The plot map ID
 * @param payload - Plot map data to update
 * @returns Updated PlotMapRecord
 */
export async function updatePlotMap(
  farmerId: string,
  plotId: string,
  mapId: string,
  payload: Partial<PlotMapRecord>
): Promise<PlotMapRecord> {
  try {
    const { data } = await api.put<PlotMapRecord>(
      `/farmers/${farmerId}/plots/${plotId}/maps/${mapId}`,
      payload
    );
    return data;
  } catch (error) {
    console.error(`Error updating plot map ${mapId}:`, error);
    throw error;
  }
}

/**
 * Delete a plot map/recording
 * @param farmerId - The farmer ID
 * @param plotId - The plot ID
 * @param mapId - The plot map ID
 * @returns Success response
 */
export async function deletePlotMap(
  farmerId: string,
  plotId: string,
  mapId: string
): Promise<{ message: string }> {
  try {
    const { data } = await api.delete<{ message: string }>(
      `/farmers/${farmerId}/plots/${plotId}/maps/${mapId}`
    );
    return data;
  } catch (error) {
    console.error(`Error deleting plot map ${mapId}:`, error);
    throw error;
  }
}
