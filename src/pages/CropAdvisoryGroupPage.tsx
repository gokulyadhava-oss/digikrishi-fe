import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCropAdvisoryRecords, useRegroupVariety } from "@/hooks/useCropAdvisoryAdmin";
import type { CropAdvisoryAdminRecord } from "@/api/crop-advisory-admin";

interface VarietyGroupDerived {
  key: string;
  varieties: string[];
  records: CropAdvisoryAdminRecord[];
  allActive: boolean;
}

function deriveGroups(records: CropAdvisoryAdminRecord[]): VarietyGroupDerived[] {
  const map = new Map<string, { varieties: string[]; records: CropAdvisoryAdminRecord[] }>();
  for (const r of records) {
    const key = [...r.varieties].sort().join("|");
    if (!map.has(key)) map.set(key, { varieties: r.varieties, records: [] });
    map.get(key)!.records.push(r);
  }
  return Array.from(map.entries()).map(([key, { varieties, records }]) => ({
    key,
    varieties,
    records,
    allActive: records.length > 0 && records.every((r) => r.is_active),
  }));
}

interface MoveDialogState {
  variety: string;
  fromGroup: VarietyGroupDerived;
  toGroup: VarietyGroupDerived | null; // null = new solo group
}

function MoveDialog({
  state,
  groups,
  crop,
  season,
  onClose,
}: {
  state: MoveDialogState;
  groups: VarietyGroupDerived[];
  crop: string;
  season: string;
  onClose: () => void;
}) {
  const [targetKey, setTargetKey] = useState<string | null>(null);
  const regroup = useRegroupVariety(crop, season);

  const otherGroups = groups.filter((g) => g.key !== state.fromGroup.key);

  async function handleConfirm() {
    const toGroup = targetKey ? groups.find((g) => g.key === targetKey) ?? null : null;
    await regroup.mutateAsync({
      crop,
      season,
      fromVarieties: state.fromGroup.varieties,
      movedVariety: state.variety,
      toVarieties: toGroup?.varieties ?? [],
    });
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move variety: {state.variety}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 p-4">
          <p className="text-sm text-muted-foreground">Move to:</p>
          {/* New solo group option */}
          <button
            onClick={() => setTargetKey(null)}
            className={`flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
              targetKey === null
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <div className={`h-2 w-2 rounded-full ${targetKey === null ? "bg-green-700" : "bg-muted-foreground/40"}`} />
            New solo group (only {state.variety})
          </button>
          {otherGroups.map((g) => (
            <button
              key={g.key}
              onClick={() => setTargetKey(g.key)}
              className={`flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                targetKey === g.key
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <div className={`h-2 w-2 rounded-full ${targetKey === g.key ? "bg-green-700" : "bg-muted-foreground/40"}`} />
              <span>{g.varieties.join(", ")}</span>
              <span className="ml-auto text-xs text-muted-foreground">{g.records.length} activities</span>
            </button>
          ))}
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertTriangle className="mb-0.5 mr-1 inline-block h-3 w-3" />
            Moving to a new group will copy all {state.fromGroup.records.length} activities to a separate POP for {state.variety}.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={regroup.isPending}
            className="bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700"
          >
            {regroup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Move Variety
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GroupColumn({
  group,
  crop,
  season,
  onMoveRequest,
}: {
  group: VarietyGroupDerived;
  crop: string;
  season: string;
  onMoveRequest: (v: string, from: VarietyGroupDerived) => void;
}) {
  const timelineHref = `/crop-advisory/${encodeURIComponent(crop)}/${encodeURIComponent(season)}/timeline?varieties=${encodeURIComponent(group.varieties.join(","))}`;

  return (
    <div
      className="flex flex-col rounded-xl border border-border bg-card shadow-sm"
      style={{ minWidth: 240 }}
    >
      <div className="flex items-center justify-between rounded-t-xl bg-green-50 px-3 py-2 dark:bg-green-900/20">
        <div className="flex items-center gap-1.5">
          {group.allActive ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <Clock className="h-4 w-4 text-amber-500" />
          )}
          <span className="text-sm font-medium text-green-800 dark:text-green-300">
            {group.records.length} activities
          </span>
        </div>
        <Link to={timelineHref}>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
            <Eye className="h-3.5 w-3.5" /> Timeline
          </Button>
        </Link>
      </div>

      <div className="flex flex-1 flex-wrap gap-1.5 p-3">
        {group.varieties.map((v) => (
          <div
            key={v}
            className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 pl-2.5 pr-1 py-0.5 text-xs text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"
          >
            <span>{v}</span>
            {group.varieties.length > 1 && (
              <button
                onClick={() => onMoveRequest(v, group)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-green-100 transition-colors dark:hover:bg-green-800"
                title="Move to another group"
              >
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3">
        <Link to={timelineHref}>
          <Button
            size="sm"
            className="w-full gap-1.5 bg-green-700 text-xs text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700"
          >
            Edit POP <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function CropAdvisoryGroupPage() {
  const { crop = "", season = "" } = useParams<{ crop: string; season: string }>();
  const decodedCrop = decodeURIComponent(crop);
  const decodedSeason = decodeURIComponent(season);

  const { data, isLoading } = useCropAdvisoryRecords(decodedCrop, decodedSeason);
  const [moveState, setMoveState] = useState<MoveDialogState | null>(null);

  const groups = data ? deriveGroups(data.records) : [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link to="/crop-advisory">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {decodedCrop} — {decodedSeason}
          </h2>
          <p className="text-sm text-muted-foreground">
            {groups.length} variety {groups.length === 1 ? "group" : "groups"} · drag varieties to
            reorganize groups
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <PageLoader />
        </div>
      ) : groups.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">No data for this crop / season.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {groups.map((g) => (
            <GroupColumn
              key={g.key}
              group={g}
              crop={decodedCrop}
              season={decodedSeason}
              onMoveRequest={(v, from) => setMoveState({ variety: v, fromGroup: from, toGroup: null })}
            />
          ))}
        </div>
      )}

      {moveState && (
        <MoveDialog
          state={moveState}
          groups={groups}
          crop={decodedCrop}
          season={decodedSeason}
          onClose={() => setMoveState(null)}
        />
      )}
    </div>
  );
}
