import { Link } from "react-router-dom";
import { Plus, Leaf, Layers, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/loader";
import { useCropAdvisoryTemplates } from "@/hooks/useCropAdvisoryAdmin";
import type { CropAdvisoryTemplate } from "@/api/crop-advisory-admin";

const SEASON_COLORS: Record<string, string> = {
  Kharif: "bg-green-100 text-green-800 border-green-300",
  Rabi: "bg-blue-100 text-blue-800 border-blue-300",
  Zaid: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

function TemplateCard({ tpl }: { tpl: CropAdvisoryTemplate }) {
  const allActive = tpl.variety_groups.every((g) => g.active === g.total && g.total > 0);
  const totalActivities = tpl.variety_groups.reduce((s, g) => s + g.total, 0);
  const seasonClass = SEASON_COLORS[tpl.season] ?? "bg-gray-100 text-gray-800 border-gray-300";

  return (
    <Link to={`/crop-advisory/${encodeURIComponent(tpl.crop)}/${encodeURIComponent(tpl.season)}`}>
      <Card className="cursor-pointer rounded-[18px] border border-border transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                className="bg-green-50 dark:bg-green-900/30"
              >
                <Leaf className="h-5 w-5 text-green-700 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{tpl.crop}</p>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${seasonClass}`}
                >
                  {tpl.season}
                </span>
              </div>
            </div>
            {allActive ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 shrink-0 text-amber-500" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{tpl.total_groups}</span>{" "}
                {tpl.total_groups === 1 ? "group" : "groups"}
              </span>
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">{totalActivities}</span> activities
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {tpl.variety_groups.slice(0, 4).flatMap((g) =>
              g.varieties.slice(0, 2).map((v) => (
                <span
                  key={v}
                  className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"
                >
                  {v}
                </span>
              ))
            )}
            {tpl.variety_groups.reduce((s, g) => s + g.varieties.length, 0) > 8 && (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                +more
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CropAdvisoryPage() {
  const { data: templates, isLoading } = useCropAdvisoryTemplates();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Crop Advisory (POP)</h2>
          <p className="text-sm text-muted-foreground">
            Manage Plan of Practice for all crops and seasons
          </p>
        </div>
        <Link to="/crop-advisory/new">
          <Button className="gap-2 bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700">
            <Plus className="h-4 w-4" />
            Add New POP
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <PageLoader />
        </div>
      ) : !templates?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <Leaf className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No crop advisory plans found.</p>
          <Link to="/crop-advisory/new" className="mt-3">
            <Button variant="outline" size="sm">Add your first POP</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((tpl) => (
            <TemplateCard key={`${tpl.crop}-${tpl.season}`} tpl={tpl} />
          ))}
        </div>
      )}
    </div>
  );
}
