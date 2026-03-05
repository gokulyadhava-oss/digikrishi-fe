import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFarmerPlots,
  fetchFarmerPlot,
  fetchPlotMaps,
  fetchPlotMap,
  createPlot,
  updatePlot,
  deletePlot,
  savePlotMap,
  updatePlotMap,
  deletePlotMap,
  type FarmerPlot,
  type PlotMapRecord,
} from "@/api/plots";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/utils";

export type { FarmerPlot, FarmerPlotRecord, PlotMapRecord, PlotCoordinate, GpsPathPoint } from "@/api/plots";

/**
 * Fetch all plots for a specific farmer
 * @param farmerId - The farmer ID to fetch plots for
 * @param enabled - Whether the query is enabled (default: true)
 */
export function useFarmerPlots(farmerId?: string, enabled = true) {
  return useQuery({
    queryKey: ["farmer", farmerId, "plots"],
    queryFn: () => {
      if (!farmerId) return Promise.resolve([]);
      return fetchFarmerPlots(farmerId);
    },
    enabled: !!farmerId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Fetch a specific plot with its maps
 * @param farmerId - The farmer ID
 * @param plotId - The plot ID
 */
export function useFarmerPlot(farmerId?: string, plotId?: string) {
  return useQuery({
    queryKey: ["farmer", farmerId, "plot", plotId],
    queryFn: () => {
      if (!farmerId || !plotId) return Promise.resolve(null);
      return fetchFarmerPlot(farmerId, plotId);
    },
    enabled: !!farmerId && !!plotId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch plot maps (GPS recordings) for a specific plot
 * @param farmerId - The farmer ID
 * @param plotId - The plot ID
 */
export function usePlotMaps(farmerId?: string, plotId?: string) {
  return useQuery({
    queryKey: ["farmer", farmerId, "plot", plotId, "maps"],
    queryFn: () => {
      if (!farmerId || !plotId) return Promise.resolve([]);
      return fetchPlotMaps(farmerId, plotId);
    },
    enabled: !!farmerId && !!plotId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

/**
 * Fetch a specific plot map/recording
 * @param farmerId - The farmer ID
 * @param plotId - The plot ID
 * @param mapId - The plot map ID
 */
export function usePlotMap(farmerId?: string, plotId?: string, mapId?: string) {
  return useQuery({
    queryKey: ["farmer", farmerId, "plot", plotId, "map", mapId],
    queryFn: () => {
      if (!farmerId || !plotId || !mapId) return Promise.resolve(null);
      return fetchPlotMap(farmerId, plotId, mapId);
    },
    enabled: !!farmerId && !!plotId && !!mapId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

/**
 * Create a new plot for a farmer
 */
export function useCreatePlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ farmerId, payload }: { farmerId: string; payload: Partial<FarmerPlot> }) =>
      createPlot(farmerId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["farmer", data.farmer_id, "plots"] });
      toast.success("Plot created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Update an existing plot
 */
export function useUpdatePlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      farmerId,
      plotId,
      payload,
    }: {
      farmerId: string;
      plotId: string;
      payload: Partial<FarmerPlot>;
    }) => updatePlot(farmerId, plotId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["farmer", data.farmer_id, "plots"] });
      queryClient.invalidateQueries({
        queryKey: ["farmer", data.farmer_id, "plot", data.id],
      });
      toast.success("Plot updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Delete a plot
 */
export function useDeletePlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ farmerId, plotId }: { farmerId: string; plotId: string }) =>
      deletePlot(farmerId, plotId),
    onSuccess: (_, { farmerId }) => {
      queryClient.invalidateQueries({ queryKey: ["farmer", farmerId, "plots"] });
      toast.success("Plot deleted successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Save a new plot map/recording
 */
export function useSavePlotMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      farmerId,
      plotId,
      payload,
    }: {
      farmerId: string;
      plotId: string;
      payload: Partial<PlotMapRecord>;
    }) => savePlotMap(farmerId, plotId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["farmer", data.plot_id === data.id ? undefined : data.plot_id, "plot", "maps"],
      });
      queryClient.invalidateQueries({
        queryKey: ["farmer", undefined, "plots"],
      });
      toast.success("Plot map saved successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Update an existing plot map
 */
export function useUpdatePlotMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      farmerId,
      plotId,
      mapId,
      payload,
    }: {
      farmerId: string;
      plotId: string;
      mapId: string;
      payload: Partial<PlotMapRecord>;
    }) => updatePlotMap(farmerId, plotId, mapId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["farmer", undefined, "plot", data.plot_id, "maps"],
      });
      queryClient.invalidateQueries({
        queryKey: ["farmer", undefined, "plot", data.plot_id, "map", data.id],
      });
      toast.success("Plot map updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Delete a plot map/recording
 */
export function useDeletePlotMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      farmerId,
      plotId,
      mapId,
    }: {
      farmerId: string;
      plotId: string;
      mapId: string;
    }) => deletePlotMap(farmerId, plotId, mapId),
    onSuccess: (_, { farmerId, plotId }) => {
      queryClient.invalidateQueries({
        queryKey: ["farmer", farmerId, "plot", plotId, "maps"],
      });
      toast.success("Plot map deleted successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
