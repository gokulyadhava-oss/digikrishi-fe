import { useState, useRef, useEffect, useMemo } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { GoogleMap, Polygon as GooglePolygon, Polyline as GooglePolyline, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loader";
import { Map as MapIcon, Satellite } from "lucide-react";
import { usePlotMap } from "@/hooks/useFarmerPlots";
import type { PlotMapRecord, PlotCoordinate } from "@/api/plots";

interface PlotMapViewerProps {
  plotMaps: PlotMapRecord[];
  isLoading?: boolean;
  /** When provided, full map (with gps_path) is fetched for the selected map so the plot line shows */
  farmerId?: string;
  plotId?: string;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const mapOptions: Record<string, unknown> = {
  fullscreenControl: true,
  streetViewControl: false,
  mapTypeControl: true,
};

/** Default center when no coordinates (India) */
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
const DEFAULT_ZOOM = 4;

/**
 * Fallback center and zoom when bounds haven't been applied yet (e.g. before map load).
 */
function getInitialBounds(coordinates: PlotCoordinate[]) {
  if (!coordinates.length) return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
  let minLat = coordinates[0].latitude, maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude, maxLng = coordinates[0].longitude;
  for (const c of coordinates) {
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLng = Math.min(minLng, c.longitude);
    maxLng = Math.max(maxLng, c.longitude);
  }
  return {
    center: { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 },
    zoom: 18,
  };
}

/** Assam: 1 bigha = 0.33 acres (approx). Bigha from acres. */
const ACRES_PER_BIGHA = 0.33;

/**
 * Format area in multiple units (Bigha, Acres, Hectares). Bigha computed in frontend.
 */
function formatArea(map: PlotMapRecord) {
  const bigha = map.area_acres / ACRES_PER_BIGHA;
  return {
    bigha: bigha.toFixed(2),
    acres: map.area_acres.toFixed(2),
    hectares: map.area_hectares.toFixed(2),
  };
}

const GREEN = "#22C55E";

/**
 * Polygon path for Google Maps. API closes the path automatically; do not repeat first point as last.
 */
function getPolygonPath(coordinates: PlotCoordinate[]): { lat: number; lng: number }[] {
  if (!Array.isArray(coordinates) || coordinates.length < 3) return [];
  return coordinates.map((c) => ({ lat: Number(c.latitude), lng: Number(c.longitude) }));
}

export function PlotMapViewer({ plotMaps, isLoading = false, farmerId, plotId }: PlotMapViewerProps) {
  const [selectedMap, setSelectedMap] = useState<PlotMapRecord | null>(plotMaps[0] || null);
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">("roadmap");
  const [infoWindowId, setInfoWindowId] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  const { data: fullMap } = usePlotMap(farmerId, plotId, selectedMap?.id);
  const currentMapForDisplay = fullMap ?? selectedMap ?? plotMaps[0];

  const { isLoaded: isScriptLoaded, loadError: scriptLoadError } = useJsApiLoader({
    id: "google-map-plot-viewer",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || "",
    preventGoogleFontsLoading: true,
  });

  useEffect(() => {
    if (plotMaps.length > 0 && !selectedMap) {
      setSelectedMap(plotMaps[0]);
    }
  }, [plotMaps, selectedMap]);

  const polygonPath = useMemo(
    () => (currentMapForDisplay ? getPolygonPath(currentMapForDisplay.coordinates) : []),
    [currentMapForDisplay]
  );
  const canDrawPolygon = polygonPath.length >= 3;

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plot Maps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center space-y-2">
            <p className="text-muted-foreground font-medium">Google Maps API Key Missing</p>
            <p className="text-sm text-muted-foreground">
              Please add your Google Maps API key to the <code className="bg-muted px-2 py-1 rounded">.env</code> file:
            </p>
            <code className="block bg-muted p-3 rounded text-xs mt-4">
              VITE_GOOGLE_MAPS_API_KEY=your_key_here
            </code>
            <p className="text-xs text-muted-foreground mt-4">
              Get one at: <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-primary underline">
                Google Cloud Console
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plot Maps</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-24">
          <PageLoader />
        </CardContent>
      </Card>
    );
  }

  if (plotMaps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plot Maps</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <MapIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No plot maps recorded yet</p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Record a plot boundary using the mobile app to see it here
          </p>
        </CardContent>
      </Card>
    );
  }

  const initialBounds = getInitialBounds(currentMapForDisplay.coordinates);
  const area = formatArea(currentMapForDisplay);

  const allPointsForBounds = useMemo(() => {
    const pts: { lat: number; lng: number }[] = polygonPath.length >= 3 ? [...polygonPath] : [];
    if (currentMapForDisplay.gps_path?.length) {
      currentMapForDisplay.gps_path.forEach((p) => pts.push({ lat: Number(p.latitude), lng: Number(p.longitude) }));
    }
    return pts;
  }, [polygonPath, currentMapForDisplay.gps_path]);

  useEffect(() => {
    if (!mapRef.current || !allPointsForBounds.length || typeof google === "undefined" || !google.maps) return;
    const bounds = new google.maps.LatLngBounds();
    allPointsForBounds.forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 40);
  }, [allPointsForBounds]);

  if (scriptLoadError) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground font-medium">Map unavailable</p>
          <p className="text-sm text-muted-foreground mt-1">Failed to load map script.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Selection Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {plotMaps.map((map) => (
          <Button
            key={map.id}
            variant={selectedMap?.id === map.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedMap(map);
              setInfoWindowId(null);
            }}
            className="whitespace-nowrap"
          >
            <MapIcon className="h-4 w-4 mr-2" />
            {map.name}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">

                {currentMapForDisplay.name}
              </CardTitle>
              {currentMapForDisplay.created_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Recorded: {new Date(currentMapForDisplay.created_at).toLocaleDateString()}
                </p>
              )}
            </div>

            
            <div className="flex gap-2">
              <Button
                variant={mapType === "roadmap" ? "default" : "outline"}
                size="sm"
                onClick={() => setMapType("roadmap")}
                title="Road map view"
              >
                <MapIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={mapType === "satellite" ? "default" : "outline"}
                size="sm"
                onClick={() => setMapType("satellite")}
                title="Satellite view"
              >
                <Satellite className="h-4 w-4" />
              </Button>
            </div>
            
          </div>
            {/* Area Information */}
            <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Bigha</p>
              <p className="text-lg font-bold text-white">{area.bigha}</p>
              <p className="text-xs text-muted-foreground">bigha</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Acres</p>
              <p className="text-lg font-bold text-white">{area.acres}</p>
              <p className="text-xs text-muted-foreground">acres</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Hectares</p>
              <p className="text-lg font-bold text-white">{area.hectares}</p>
              <p className="text-xs text-muted-foreground">hectares</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Map Container - only render when script is loaded so google is defined */}
          {!isScriptLoaded ? (
            <div className="rounded-lg border border-white/20 flex items-center justify-center" style={{ height: "500px" }}>
              <PageLoader />
              <span className="sr-only">Loading map…</span>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border border-white/20 shadow-lg" style={{ height: "500px", minHeight: "500px" }}>
              <GoogleMap
                key={`map-${currentMapForDisplay.id}`}
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={initialBounds.center}
                zoom={initialBounds.zoom}
                options={{
                  ...mapOptions,
                  mapTypeId: mapType,
                }}
                onLoad={(map) => {
                  mapRef.current = map;
                  if (allPointsForBounds.length && typeof google !== "undefined" && google.maps) {
                    const bounds = new google.maps.LatLngBounds();
                    allPointsForBounds.forEach((p) => bounds.extend(p));
                    map.fitBounds(bounds, 40);
                  }
                }}
              >
                {/* GPS Path (walking path) - draw under polygon so green fill shows on top */}
                {currentMapForDisplay.gps_path && currentMapForDisplay.gps_path.length > 1 && (
                  <GooglePolyline
                    path={currentMapForDisplay.gps_path.map((p) => ({
                      lat: Number(p.latitude),
                      lng: Number(p.longitude),
                    }))}
                    options={{
                      strokeColor: "#0d9488",
                      strokeWeight: 3,
                      strokeOpacity: 0.9,
                      geodesic: true,
                    }}
                  />
                )}
                {currentMapForDisplay.gps_path && currentMapForDisplay.gps_path.length >= 2 && (
                  <GooglePolyline
                    path={[
                      {
                        lat: Number(currentMapForDisplay.gps_path[currentMapForDisplay.gps_path.length - 1].latitude),
                        lng: Number(currentMapForDisplay.gps_path[currentMapForDisplay.gps_path.length - 1].longitude),
                      },
                      {
                        lat: Number(currentMapForDisplay.gps_path[0].latitude),
                        lng: Number(currentMapForDisplay.gps_path[0].longitude),
                      },
                    ]}
                    options={{
                      strokeColor: "#0d9488",
                      strokeWeight: 2,
                      strokeOpacity: 0.6,
                      geodesic: true,
                    }}
                  />
                )}

                {/* Boundary Polygon - filled green; use path= so API closes and fills correctly */}
                {canDrawPolygon && (
                  <GooglePolygon
                    path={polygonPath}
                    options={{
                      fillColor: "#22C55E",
                      fillOpacity: 0.7,
                      strokeColor: GREEN,
                      strokeWeight: 3,
                      strokeOpacity: 1,
                    }}
                  />
                )}

                {/* Start Point Marker */}
                {currentMapForDisplay.coordinates.length > 0 && (
                  <Marker
                    position={{
                      lat: currentMapForDisplay.coordinates[0].latitude,
                      lng: currentMapForDisplay.coordinates[0].longitude,
                    }}
                    icon={
                      typeof google !== "undefined" && google.maps
                        ? {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#22c55e",
                            fillOpacity: 0.9,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                          }
                        : undefined
                    }
                    onClick={() => setInfoWindowId("start")}
                  />
                )}

                {/* Start Info Window */}
                {infoWindowId === "start" && currentMapForDisplay.coordinates.length > 0 && (
                  <InfoWindow
                    position={{
                      lat: currentMapForDisplay.coordinates[0].latitude,
                      lng: currentMapForDisplay.coordinates[0].longitude,
                    }}
                    onCloseClick={() => setInfoWindowId(null)}
                  >
                    <div className="bg-white p-2 rounded text-sm">
                      <p className="font-semibold text-black">Start Point</p>
                      <p className="text-xs text-gray-600">
                        {currentMapForDisplay.coordinates[0].latitude.toFixed(6)}, {currentMapForDisplay.coordinates[0].longitude.toFixed(6)}
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
          )}

        


     
        </CardContent>
      </Card>
    </div>
  );
}
