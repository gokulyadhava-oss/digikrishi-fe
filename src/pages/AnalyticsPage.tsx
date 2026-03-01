import { useState, type ReactNode } from "react";
// Line and pie charts via Recharts
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  useAnalyticsSummary,
  useAnalyticsByDistrict,
  useAnalyticsByAgent,
  useAnalyticsByFpc,
  useAnalyticsRationCardStats,
  useAnalyticsByVillage,
  useAnalyticsByTaluka,
  useAnalyticsByMonth,
} from "@/hooks/useAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader } from "@/components/ui/loader";
import type { AnalyticsByKey } from "@/types";

type AnalyticsSection = "location" | "demographics" | "profile" | "time";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

// Green, modern axis styling
const AXIS_STROKE = "var(--chart-axis)";
const GRID_STROKE = "var(--chart-grid)";
const TICK_STYLE = { fill: "var(--muted-foreground)", fontSize: 11 };
const AXIS_LINE = { stroke: AXIS_STROKE, strokeWidth: 1.5 };

/** Tooltip styling so chart tooltips respect light/dark theme */
const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    margin: 0,
    padding: "10px 12px",
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow-md)",
    whiteSpace: "nowrap" as const,
  },
  itemStyle: { color: "var(--popover-foreground)" },
  labelStyle: { color: "var(--popover-foreground)" },
};

const LABEL_MAX_LEN = 14;
function truncateLabel(name: string, maxLen = LABEL_MAX_LEN) {
  const s = String(name).trim();
  if (s.length <= maxLen) return s;
  if (maxLen <= 3) return s.slice(0, maxLen);
  return s.slice(0, maxLen - 3) + "...";
}

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="absolute inset-0 flex flex-col gap-2 p-4 rounded-md"
      style={{ minHeight: height }}
      aria-hidden
    >
      <div className="flex-1 flex items-end gap-1">
        {[40, 65, 45, 80, 55, 70, 50, 60, 75, 45].map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 min-w-[6px] rounded-sm"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ChartBox({
  height = 320,
  hasData,
  isLoading,
  children,
}: {
  height?: number;
  hasData: boolean;
  isLoading?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative w-full rounded-md border border-border/50 bg-muted/30" style={{ minHeight: height }}>
      {isLoading && <ChartSkeleton height={height} />}
      <div className={isLoading ? "invisible pointer-events-none absolute inset-0" : "relative"}>
        {hasData ? (
          children
        ) : (
          <div
            className="flex items-center justify-center text-muted-foreground text-sm"
            style={{ minHeight: height }}
          >
            No data yet
          </div>
        )}
      </div>
    </div>
  );
}

function barData(data: AnalyticsByKey[] | undefined, nameKey: keyof AnalyticsByKey) {
  return (data ?? []).map((d) => ({
    name: String(d[nameKey] ?? "—"),
    count: d.count,
  }));
}

export function AnalyticsPage() {
  const [locationLimit] = useState(12);
  const [section, setSection] = useState<AnalyticsSection>("location");

  const summary = useAnalyticsSummary();
  const byDistrict = useAnalyticsByDistrict();
  const byAgent = useAnalyticsByAgent();
  const byFpc = useAnalyticsByFpc();
  const rationStats = useAnalyticsRationCardStats();
  const byVillage = useAnalyticsByVillage(locationLimit);
  const byTaluka = useAnalyticsByTaluka(locationLimit);
  const byMonth = useAnalyticsByMonth();

  const districtData = barData(byDistrict.data, "district");
  const agentData = barData(byAgent.data, "agent_id");
  const fpcData = barData(byFpc.data, "fpc");
  const villageData = barData(byVillage.data, "village");
  const talukaData = barData(byTaluka.data, "taluka");
  const monthData = (byMonth.data ?? []).map((d) => ({
    name: d.month ?? "—",
    count: d.count,
  }));

  const rationPieData = rationStats.data
    ? [
        { name: "With ration card", value: rationStats.data.with_ration_card },
        { name: "Without", value: rationStats.data.without_ration_card },
      ]
    : [];

  const isLoading =
    summary.isLoading ||
    byDistrict.isLoading ||
    byMonth.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Farmer analytics from CSV and app data: location and demographics
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Total farmers</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.isLoading ? (
              <Skeleton className="h-8 w-16 rounded" aria-hidden />
            ) : (
              <p className="text-2xl font-bold">{summary.data?.total_farmers ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Unique FPCs</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.isLoading ? (
              <Skeleton className="h-8 w-16 rounded" aria-hidden />
            ) : (
              <p className="text-2xl font-bold">{summary.data?.unique_fpcs ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Unique SHGs</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.isLoading ? (
              <Skeleton className="h-8 w-16 rounded" aria-hidden />
            ) : (
              <p className="text-2xl font-bold">{summary.data?.unique_shgs ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Ration card</CardTitle>
          </CardHeader>
          <CardContent>
            {rationStats.isLoading ? (
              <Skeleton className="h-8 w-20 rounded" aria-hidden />
            ) : (
              <p className="text-2xl font-bold">
                {rationStats.data
                  ? rationStats.data.with_ration_card + rationStats.data.without_ration_card > 0
                    ? Math.round(
                        (rationStats.data.with_ration_card /
                          (rationStats.data.with_ration_card +
                            rationStats.data.without_ration_card)) *
                          100
                      )
                    : 0
                  : 0}
                % have
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={section === "location" ? "default" : "outline"}
          size="sm"
          onClick={() => setSection("location")}
        >
          Location
        </Button>
   
        <Button
          variant={section === "profile" ? "default" : "outline"}
          size="sm"
          onClick={() => setSection("profile")}
        >
          Profile & CSV
        </Button>
        <Button
          variant={section === "time" ? "default" : "outline"}
          size="sm"
          onClick={() => setSection("time")}
        >
          Trends
        </Button>
      </div>

      {section === "location" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>By district</CardTitle>
                <CardDescription>Farmers per district (top)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartBox height={288} hasData={districtData.length > 0} isLoading={byDistrict.isLoading}>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={districtData} margin={{ top: 20, right: 20, left: 0, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ ...TICK_STYLE, fontSize: 10 }}
                          tickFormatter={truncateLabel}
                          axisLine={AXIS_LINE}
                          tickLine={{ stroke: AXIS_STROKE }}
                        />
                        <YAxis tick={TICK_STYLE} axisLine={AXIS_LINE} tickLine={{ stroke: AXIS_STROKE }} />
                        <Tooltip {...CHART_TOOLTIP_STYLE} />
                        <Line type="monotone" dataKey="count" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 4 }} name="Farmers" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartBox>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Location summary</CardTitle>
                <CardDescription>Coverage from current data</CardDescription>
              </CardHeader>
              <CardContent>
                {byDistrict.isLoading ? (
                  <div className="flex flex-col gap-3" style={{ minHeight: 288 }}>
                    <Skeleton className="h-14 w-full rounded" />
                    <Skeleton className="h-14 w-full rounded" />
                    <Skeleton className="h-14 w-full rounded" />
                    <Skeleton className="h-14 w-full rounded" />
                  </div>
                ) : (
                  <div className="space-y-4" style={{ minHeight: 288 }}>
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                      <p className="text-sm text-muted-foreground">Districts</p>
                      <p className="text-2xl font-bold">{districtData.length}</p>
                    </div>
                    {districtData.length > 0 && (
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                        <p className="text-sm text-muted-foreground">Top district</p>
                        <p className="text-lg font-semibold truncate" title={districtData[0].name}>
                          {districtData[0].name}
                        </p>
                        <p className="text-2xl font-bold text-primary">{districtData[0].count} farmers</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground">Top villages</p>
                        <p className="text-xl font-bold">{villageData.length}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground">Top talukas</p>
                        <p className="text-xl font-bold">{talukaData.length}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>By village (top {locationLimit})</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={288} hasData={villageData.length > 0} isLoading={byVillage.isLoading}>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={villageData} margin={{ top: 20, right: 20, left: 0, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ ...TICK_STYLE, fontSize: 10 }}
                          tickFormatter={truncateLabel}
                          axisLine={AXIS_LINE}
                          tickLine={{ stroke: AXIS_STROKE }}
                        />
                        <YAxis tick={TICK_STYLE} axisLine={AXIS_LINE} tickLine={{ stroke: AXIS_STROKE }} />
                        <Tooltip {...CHART_TOOLTIP_STYLE} />
                        <Line type="monotone" dataKey="count" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 4 }} name="Farmers" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartBox>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>By taluka (top {locationLimit})</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartBox height={288} hasData={talukaData.length > 0} isLoading={byTaluka.isLoading}>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={talukaData} margin={{ top: 20, right: 20, left: 0, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ ...TICK_STYLE, fontSize: 10 }}
                          tickFormatter={truncateLabel}
                          axisLine={AXIS_LINE}
                          tickLine={{ stroke: AXIS_STROKE }}
                        />
                        <YAxis tick={TICK_STYLE} axisLine={AXIS_LINE} tickLine={{ stroke: AXIS_STROKE }} />
                        <Tooltip {...CHART_TOOLTIP_STYLE} />
                        <Line type="monotone" dataKey="count" stroke={CHART_COLORS[3]} strokeWidth={2} dot={{ r: 4 }} name="Farmers" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartBox>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {section === "demographics" && (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">No demographic charts configured.</p>
        </div>
      )}

      {section === "profile" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>By FPC</CardTitle>
                <CardDescription>Farmer Producer Company</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartBox height={288} hasData={fpcData.length > 0} isLoading={byFpc.isLoading}>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={fpcData} margin={{ top: 20, right: 20, left: 0, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ ...TICK_STYLE, fontSize: 10 }}
                          tickFormatter={truncateLabel}
                          axisLine={AXIS_LINE}
                          tickLine={{ stroke: AXIS_STROKE }}
                        />
                        <YAxis tick={TICK_STYLE} axisLine={AXIS_LINE} tickLine={{ stroke: AXIS_STROKE }} />
                        <Tooltip {...CHART_TOOLTIP_STYLE} />
                        <Line type="monotone" dataKey="count" stroke={CHART_COLORS[4]} strokeWidth={2} dot={{ r: 4 }} name="Farmers" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartBox>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Ration card</CardTitle>
                <CardDescription>With vs without ration card</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartBox
                  height={288}
                  hasData={rationPieData.length > 0 && rationPieData.some((d) => d.value > 0)}
                  isLoading={rationStats.isLoading}
                >
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={rationPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {rationPieData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip {...CHART_TOOLTIP_STYLE} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartBox>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>By agent</CardTitle>
              <CardDescription>Farmers assigned per agent</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartBox height={288} hasData={agentData.length > 0} isLoading={byAgent.isLoading}>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={agentData} margin={{ top: 20, right: 20, left: 0, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ ...TICK_STYLE, fontSize: 10 }}
                        tickFormatter={truncateLabel}
                        axisLine={AXIS_LINE}
                        tickLine={{ stroke: AXIS_STROKE }}
                      />
                      <YAxis tick={TICK_STYLE} axisLine={AXIS_LINE} tickLine={{ stroke: AXIS_STROKE }} />
                      <Tooltip {...CHART_TOOLTIP_STYLE} />
                      <Line type="monotone" dataKey="count" stroke={CHART_COLORS[5]} strokeWidth={2} dot={{ r: 4 }} name="Farmers" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartBox>
            </CardContent>
          </Card>
        </div>
      )}

      {section === "time" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrations by month</CardTitle>
              <CardDescription>New farmers created per month (from created_at)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartBox height={384} hasData={monthData.length > 0} isLoading={byMonth.isLoading}>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                      <XAxis dataKey="name" tick={TICK_STYLE} axisLine={AXIS_LINE} tickLine={{ stroke: AXIS_STROKE }} />
                      <YAxis tick={TICK_STYLE} axisLine={AXIS_LINE} tickLine={{ stroke: AXIS_STROKE }} />
                      <Tooltip {...CHART_TOOLTIP_STYLE} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={CHART_COLORS[0]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Farmers"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartBox>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16 px-6 rounded-xl border-2 border-primary/40 bg-primary/5 shadow-md min-h-[200px]" aria-busy="true" aria-label="Loading analytics">
          <Loader className="scale-150" />
        </div>
      )}
    </div>
  );
}
