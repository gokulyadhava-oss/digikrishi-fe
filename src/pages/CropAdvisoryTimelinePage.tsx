import { useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  Loader2,
  X,
  Trash2,
  Save,
  Eye,
  EyeOff,
  GripHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader } from "@/components/ui/loader";
import {
  useGroupRecords,
  useCreateAdvisory,
  useUpdateAdvisory,
  useDeleteAdvisory,
  usePublishGroup,
} from "@/hooks/useCropAdvisoryAdmin";
import type { CropAdvisoryAdminRecord } from "@/api/crop-advisory-admin";

// ── Constants ────────────────────────────────────────────────────────────────
const PX_PER_DAY = 14;
const STAGE_COL_W = 180;
const LANE_H = 44;       // height of one activity lane
const AXIS_H = 48;       // height of the day axis header
const ROW_PAD = 10;      // padding above/below lanes in a row
const DRAG_THRESHOLD = 5; // pixels before a move is considered a drag

// ── Activity type colour map ─────────────────────────────────────────────────
const TYPE_CONFIGS = [
  { pattern: /fertiliz/i,           bar: "#bbf7d0", border: "#22c55e", label: "Fertilizer" },
  { pattern: /irrigation|water/i,   bar: "#bfdbfe", border: "#3b82f6", label: "Irrigation" },
  { pattern: /pest/i,               bar: "#fecaca", border: "#ef4444", label: "Pest Mgmt"  },
  { pattern: /disease/i,            bar: "#fed7aa", border: "#f97316", label: "Disease"    },
  { pattern: /weed/i,               bar: "#fde68a", border: "#f59e0b", label: "Weed Mgmt"  },
  { pattern: /harvest/i,            bar: "#a7f3d0", border: "#10b981", label: "Harvest"    },
  { pattern: /sow|plant|seed/i,     bar: "#ddd6fe", border: "#8b5cf6", label: "Sowing"     },
  { pattern: /soil|land|till|plough/i, bar: "#fef08a", border: "#ca8a04", label: "Soil Prep" },
] as const;
const DEFAULT_CFG = { bar: "#e5e7eb", border: "#6b7280", label: "General" };

function getTypeCfg(type: string | null) {
  if (!type) return DEFAULT_CFG;
  return TYPE_CONFIGS.find(({ pattern }) => pattern.test(type)) ?? DEFAULT_CFG;
}

// ── Lane assignment (avoids overlaps) ───────────────────────────────────────
function assignLanes(recs: CropAdvisoryAdminRecord[]): Map<string, number> {
  const sorted = [...recs].sort((a, b) => (a.start_day ?? 0) - (b.start_day ?? 0));
  const result = new Map<string, number>();
  const laneEnd: number[] = [];
  for (const r of sorted) {
    const s = r.start_day ?? 0;
    const e = r.end_day ?? s;
    let lane = laneEnd.findIndex((end) => end < s);
    if (lane === -1) { lane = laneEnd.length; laneEnd.push(e); }
    else laneEnd[lane] = e;
    result.set(r.id, lane);
  }
  return result;
}

// ── Stage layout data ────────────────────────────────────────────────────────
interface StageData {
  stageOrder: string[];
  stageRecs: Map<string, CropAdvisoryAdminRecord[]>;
  stageLanes: Map<string, Map<string, number>>;
  stageHeights: Map<string, number>;
}

function buildStageData(records: CropAdvisoryAdminRecord[]): StageData {
  const stageRecs = new Map<string, CropAdvisoryAdminRecord[]>();
  const stageOrder: string[] = [];
  for (const r of [...records].sort((a, b) => (a.start_day ?? 0) - (b.start_day ?? 0))) {
    if (!stageRecs.has(r.stage_name)) { stageRecs.set(r.stage_name, []); stageOrder.push(r.stage_name); }
    stageRecs.get(r.stage_name)!.push(r);
  }
  const stageLanes = new Map<string, Map<string, number>>();
  const stageHeights = new Map<string, number>();
  for (const stage of stageOrder) {
    const recs = stageRecs.get(stage)!;
    const lanes = assignLanes(recs);
    stageLanes.set(stage, lanes);
    const numLanes = recs.length ? Math.max(...Array.from(lanes.values())) + 1 : 1;
    stageHeights.set(stage, numLanes * LANE_H + ROW_PAD * 2);
  }
  return { stageOrder, stageRecs, stageLanes, stageHeights };
}

// ── Specifications: list of text items (one text box per item), stored as JSON array ─
function specsToItems(specs: Record<string, unknown> | string[] | null): string[] {
  if (specs == null) return [];
  if (Array.isArray(specs)) return specs.filter((s): s is string => typeof s === "string");
  const text = (specs as { text?: string }).text;
  if (typeof text === "string" && text.trim()) {
    // Legacy: "1. First... 2. Second..." → split into items (strip leading "N. " from each)
    const raw = text.split(/\n\s*(?=\d+\.\s)/).map((s) => s.replace(/^\s*\d+\.\s*/, "").trim()).filter(Boolean);
    return raw.length ? raw : [text.trim()];
  }
  return Object.values(specs).map((v) => String(v ?? "")).filter(Boolean);
}
function itemsToSpecs(items: string[]): string[] | null {
  const valid = items.map((s) => s.trim()).filter(Boolean);
  return valid.length ? valid : null;
}

function SpecsEditor({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  function update(i: number, val: string) {
    const next = [...items];
    next[i] = val;
    onChange(next);
  }
  function add() { onChange([...items, ""]); }
  function remove(i: number) { onChange(items.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input
            value={item}
            onChange={(ev) => update(i, ev.target.value)}
            placeholder={`Specification ${i + 1}`}
            className="min-h-8 flex-1 text-xs"
          />
          <button onClick={() => remove(i)} className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive" title="Remove">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="h-7 gap-1 px-2 text-xs">
        <Plus className="h-3 w-3" /> Add
      </Button>
    </div>
  );
}

// ── Steps text-list editor ───────────────────────────────────────────────────
interface StepEntry { text: string }

function stepsToEntries(steps: unknown[] | null): StepEntry[] {
  if (!steps || !steps.length) return [];
  return steps.map((s) => {
    if (typeof s === "string") return { text: s };
    if (s && typeof s === "object" && "text" in s) return { text: String((s as any).text) };
    return { text: JSON.stringify(s) };
  });
}
function entriesToSteps(entries: StepEntry[]): { step: number; text: string }[] | null {
  const valid = entries.filter((e) => e.text.trim());
  return valid.length ? valid.map((e, i) => ({ step: i + 1, text: e.text })) : null;
}

function StepsEditor({ entries, onChange }: { entries: StepEntry[]; onChange: (v: StepEntry[]) => void }) {
  function update(i: number, val: string) {
    const next = [...entries];
    next[i] = { text: val };
    onChange(next);
  }
  function add() { onChange([...entries, { text: "" }]); }
  function remove(i: number) { onChange(entries.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-1.5">
      {entries.map((e, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2 shrink-0 text-xs font-medium text-muted-foreground">{i + 1}.</span>
          <textarea
            value={e.text}
            onChange={(ev) => update(i, ev.target.value)}
            placeholder="Describe this step…"
            rows={2}
            className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button onClick={() => remove(i)} className="mt-1.5 rounded p-1 text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="h-7 gap-1 px-2 text-xs">
        <Plus className="h-3 w-3" /> Add step
      </Button>
    </div>
  );
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
interface TooltipData { record: CropAdvisoryAdminRecord; x: number; y: number }

function ActivityTooltip({ data }: { data: TooltipData }) {
  const { record, x, y } = data;
  const cfg = getTypeCfg(record.activity_type);
  const span = (record.end_day ?? record.start_day ?? 0) - (record.start_day ?? 0);
  // keep tooltip inside viewport
  const left = Math.min(x + 14, window.innerWidth - 280);
  const top = y - 8;

  return (
    <div
      className="pointer-events-none fixed z-[100] w-64 rounded-lg border border-border bg-popover p-3 shadow-xl text-popover-foreground"
      style={{ left, top }}
    >
      <p className="font-semibold text-sm leading-snug">{record.activity}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{record.stage_name}</p>
      <div className="mt-2 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Day range</span>
          <span className="font-medium">
            {record.start_day ?? "—"} → {record.end_day ?? "—"}
            {span > 0 && <span className="ml-1 text-muted-foreground">({span}d)</span>}
          </span>
        </div>
        {record.activity_type && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: cfg.bar, color: "#1a1a1a" }}
            >
              {record.activity_type}
            </span>
          </div>
        )}
        {record.activity_code && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Code</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                record.activity_code === "Mandatory"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {record.activity_code}
            </span>
          </div>
        )}
        {record.activity_time && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span>{record.activity_time}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className={record.is_active ? "text-green-600 dark:text-green-400" : "text-amber-500"}>
            {record.is_active ? "Published" : "Draft"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Activity Pill (draggable) ────────────────────────────────────────────────
interface DragState {
  type: "move" | "resize-left" | "resize-right";
  startX: number;
  origStart: number;
  origEnd: number;
  moved: boolean;
}

interface ActivityPillProps {
  record: CropAdvisoryAdminRecord;
  lane: number;
  minDay: number;
  selected: boolean;
  onSelect: () => void;
  onUpdateDays: (id: string, start: number, end: number) => void;
  onHover: (record: CropAdvisoryAdminRecord, x: number, y: number) => void;
  onHoverEnd: () => void;
}

function ActivityPill({
  record,
  lane,
  minDay,
  selected,
  onSelect,
  onUpdateDays,
  onHover,
  onHoverEnd,
}: ActivityPillProps) {
  const dragRef = useRef<DragState | null>(null);
  const [preview, setPreview] = useState<{ start: number; end: number } | null>(null);

  const origStart = record.start_day ?? 0;
  const origEnd = record.end_day ?? origStart;
  const dispStart = preview ? preview.start : origStart;
  const dispEnd   = preview ? preview.end   : origEnd;

  const cfg = getTypeCfg(record.activity_type);
  const isDraft   = !record.is_active;
  const isMand    = record.activity_code === "Mandatory";
  const isDragging = !!preview;

  const left  = (dispStart - minDay) * PX_PER_DAY;
  const width = Math.max((dispEnd - dispStart) * PX_PER_DAY, 160);
  const top   = ROW_PAD + lane * LANE_H + 4;
  const height = LANE_H - 10;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onHoverEnd(); // hide tooltip while dragging

    const rect = e.currentTarget.getBoundingClientRect();
    const xIn = e.clientX - rect.left;
    const type =
      xIn < 12 ? "resize-left" : xIn > rect.width - 12 ? "resize-right" : "move";

    dragRef.current = {
      type,
      startX: e.clientX,
      origStart,
      origEnd,
      moved: false,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const delta = e.clientX - dragRef.current.startX;
    if (!dragRef.current.moved && Math.abs(delta) < DRAG_THRESHOLD) return;
    dragRef.current.moved = true;

    const days = Math.round(delta / PX_PER_DAY);
    let ns = dragRef.current.origStart;
    let ne = dragRef.current.origEnd;
    if (dragRef.current.type === "move") { ns += days; ne += days; }
    else if (dragRef.current.type === "resize-left") ns = Math.min(dragRef.current.origStart + days, ne - 1);
    else ne = Math.max(dragRef.current.origEnd + days, ns + 1);

    setPreview({ start: ns, end: ne });
  }

  function handlePointerUp() {
    if (!dragRef.current) return;
    const dr = dragRef.current;
    dragRef.current = null;

    if (!dr.moved) {
      setPreview(null);
      onSelect();
      return;
    }
    if (preview) {
      onUpdateDays(record.id, preview.start, preview.end);
    }
    setPreview(null);
  }

  return (
    <div
      className={`absolute flex select-none items-stretch rounded-md text-[11px] font-medium
        transition-shadow overflow-hidden
        ${isDragging ? "cursor-grabbing shadow-xl" : "cursor-grab shadow-sm hover:shadow-md"}
        ${selected ? "ring-2 ring-offset-1 ring-green-600 dark:ring-green-400 shadow-lg" : ""}
      `}
      style={{
        left,
        width,
        top,
        height,
        backgroundColor: cfg.bar,
        border: `1.5px ${isDraft ? "dashed" : "solid"} ${cfg.border}`,
        opacity: isDraft ? 0.75 : 1,
        zIndex: isDragging || selected ? 30 : 5,
        color: "#1a1a1a", // always dark text on pastel bg
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={(e) => { if (!dragRef.current?.moved) onHover(record, e.clientX, e.clientY); }}
      onMouseMove={(e) => { if (!dragRef.current?.moved) onHover(record, e.clientX, e.clientY); }}
      onMouseLeave={onHoverEnd}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize z-10"
        style={{ background: `linear-gradient(to right, ${cfg.border}60, transparent)` }}
      />
      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize z-10"
        style={{ background: `linear-gradient(to left, ${cfg.border}60, transparent)` }}
      />
      {/* Content */}
      <div className="flex flex-1 items-center gap-1.5 px-3 py-1 overflow-hidden">
        <GripHorizontal className="h-3 w-3 shrink-0 opacity-30" />
        <span className="flex-1 truncate font-semibold">{record.activity}</span>
        <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-mono opacity-70"
          style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
          {dispStart}→{dispEnd}
        </span>
        {isMand && (
          <span className="shrink-0 rounded bg-black/20 px-1 py-0.5 text-[9px] font-bold">M</span>
        )}
        {isDraft && (
          <span className="shrink-0 rounded border border-current px-0.5 text-[9px] opacity-60">D</span>
        )}
      </div>
    </div>
  );
}

// ── Edit / create slide-in panel ─────────────────────────────────────────────
const BLANK_FORM: Partial<CropAdvisoryAdminRecord> = {
  activity: "", activity_type: null, activity_code: null, activity_time: null,
  start_day: 0, end_day: 10, is_active: true, specifications: null, steps: null,
};

function EditPanel({
  record, crop, season, varieties, stageName, onClose, onDeleted,
}: {
  record: CropAdvisoryAdminRecord | null;
  crop: string; season: string; varieties: string[];
  stageName: string; onClose: () => void; onDeleted: () => void;
}) {
  const isCreate = record === null;
  const [form, setForm] = useState<Partial<CropAdvisoryAdminRecord>>(
    record ? { ...record } : { ...BLANK_FORM, stage_name: stageName, crop, season, varieties }
  );
  const [specItems, setSpecItems] = useState<string[]>(() => specsToItems(record?.specifications ?? null));
  const [steps, setSteps] = useState<StepEntry[]>(() => stepsToEntries(record?.steps ?? null));

  const update = useUpdateAdvisory(crop, season);
  const create = useCreateAdvisory(crop, season);
  const del    = useDeleteAdvisory(crop, season);
  const isPending = update.isPending || create.isPending || del.isPending;

  function setField(key: keyof CropAdvisoryAdminRecord, val: unknown) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    const payload = {
      ...form,
      specifications: itemsToSpecs(specItems),
      steps: entriesToSteps(steps),
    };
    if (isCreate) await create.mutateAsync(payload as any);
    else await update.mutateAsync({ id: record!.id, data: payload });
    onClose();
  }

  async function handleDelete() {
    if (!record) return;
    await del.mutateAsync(record.id);
    onDeleted();
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20 dark:bg-black/40" onClick={onClose} />
      {/* Panel */}
      <div
        className="flex h-full w-[460px] flex-col border-l border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <h3 className="font-semibold text-foreground">
            {isCreate ? "Add Activity" : "Edit Activity"}
          </h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form — scrollable */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          <PanelField label="Activity name">
            <Input
              value={form.activity ?? ""}
              onChange={(e) => setField("activity", e.target.value)}
              placeholder="e.g. First fertilizer application"
            />
          </PanelField>

          <div className="grid grid-cols-2 gap-3">
            <PanelField label="Stage">
              <Input
                value={form.stage_name ?? ""}
                onChange={(e) => setField("stage_name", e.target.value)}
                placeholder="e.g. Tillering"
              />
            </PanelField>
            <PanelField label="Activity type">
              <Input
                value={form.activity_type ?? ""}
                onChange={(e) => setField("activity_type", e.target.value || null)}
                placeholder="e.g. Fertilizer"
              />
            </PanelField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <PanelField label="Start day">
              <Input
                type="number"
                value={form.start_day ?? ""}
                onChange={(e) => setField("start_day", e.target.value !== "" ? +e.target.value : null)}
              />
            </PanelField>
            <PanelField label="End day">
              <Input
                type="number"
                value={form.end_day ?? ""}
                onChange={(e) => setField("end_day", e.target.value !== "" ? +e.target.value : null)}
              />
            </PanelField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <PanelField label="Activity code">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={form.activity_code ?? ""}
                onChange={(e) => setField("activity_code", e.target.value || null)}
              >
                <option value="">— None —</option>
                <option value="Mandatory">Mandatory</option>
                <option value="Optional">Optional</option>
              </select>
            </PanelField>
            <PanelField label="Activity time">
              <Input
                value={form.activity_time ?? ""}
                onChange={(e) => setField("activity_time", e.target.value || null)}
                placeholder="e.g. Morning"
              />
            </PanelField>
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.is_active}
              onChange={(e) => setField("is_active", e.target.checked)}
              className="h-4 w-4 rounded accent-green-600"
            />
            <span className="text-sm text-muted-foreground">
              Published (visible to farmers)
            </span>
          </label>

          {/* Specifications */}
          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Specifications
            </p>
            <SpecsEditor items={specItems} onChange={setSpecItems} />
          </div>

          {/* Steps */}
          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Steps
            </p>
            <StepsEditor entries={steps} onChange={setSteps} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-background px-4 py-3">
          {!isCreate ? (
            <Button
              variant="ghost" size="sm"
              onClick={handleDelete} disabled={isPending}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              {del.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              size="sm" onClick={handleSave}
              disabled={isPending || !form.activity?.trim()}
              className="gap-1.5 bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isCreate ? "Add Activity" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ── Main Timeline Page ───────────────────────────────────────────────────────
export function CropAdvisoryTimelinePage() {
  const { crop = "", season = "" } = useParams<{ crop: string; season: string }>();
  const [searchParams] = useSearchParams();
  const decodedCrop   = decodeURIComponent(crop);
  const decodedSeason = decodeURIComponent(season);
  const varieties = (searchParams.get("varieties") ?? "")
    .split(",").map((v) => decodeURIComponent(v.trim())).filter(Boolean);

  const { data: records = [], isLoading } = useGroupRecords(decodedCrop, decodedSeason, varieties);
  const publishMutation = usePublishGroup(decodedCrop, decodedSeason);
  const updateMutation  = useUpdateAdvisory(decodedCrop, decodedSeason);

  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [addingForStage, setAddingForStage] = useState<string | null>(null);
  const [showDrafts, setShowDrafts]         = useState(true);
  const [tooltip, setTooltip]               = useState<TooltipData | null>(null);

  const visibleRecords = showDrafts ? records : records.filter((r) => r.is_active);
  // Timeline only shows records that have a date range (start_day and end_day)
  const recordsWithDateRange = visibleRecords.filter(
    (r) => r.start_day != null && r.end_day != null
  );
  const { stageOrder, stageRecs, stageLanes, stageHeights } = buildStageData(recordsWithDateRange);

  const allDays = recordsWithDateRange.flatMap((r) => [r.start_day ?? 0, r.end_day ?? 0]);
  const minDay = allDays.length ? Math.min(...allDays) - 8 : -15;
  const maxDay = allDays.length ? Math.max(...allDays) + 8 : 160;
  const timelineW = (maxDay - minDay) * PX_PER_DAY + 32;

  const hasUnpublished = records.some((r) => !r.is_active);
  const selectedRecord = records.find((r) => r.id === selectedId) ?? null;

  // Day axis ticks — every 5 days minor, every 10 major
  const majorTicks: number[] = [];
  const minorTicks: number[] = [];
  for (let d = Math.ceil(minDay / 5) * 5; d <= maxDay; d += 5) {
    if (d % 10 === 0) majorTicks.push(d);
    else minorTicks.push(d);
  }

  // Alternating 10-day bands aligned to 10-day ticks (so grid edges match the grey tick lines)
  // First band = first multiple of 20 such that band [d, d+10] overlaps [minDay, maxDay] => d >= minDay - 10
  const bands: number[] = [];
  const firstBand = Math.ceil((minDay - 10) / 20) * 20;
  for (let d = firstBand; d <= maxDay; d += 20) bands.push(d);

  const handleUpdateDays = useCallback(
    (id: string, start: number, end: number) => {
      updateMutation.mutate({ id, data: { start_day: start, end_day: end } });
    },
    [updateMutation]
  );

  const handleHover = useCallback(
    (record: CropAdvisoryAdminRecord, x: number, y: number) => {
      setTooltip({ record, x, y });
    },
    []
  );
  const handleHoverEnd = useCallback(() => setTooltip(null), []);

  function closePanel() {
    setSelectedId(null);
    setAddingForStage(null);
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden bg-background">
      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link to={`/crop-advisory/${encodeURIComponent(decodedCrop)}/${encodeURIComponent(decodedSeason)}`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {decodedCrop} · {decodedSeason}
            </h2>
            <div className="mt-0.5 flex flex-wrap gap-1">
              {varieties.map((v) => (
                <span
                  key={v}
                  className="rounded-full border border-green-300 bg-green-50 px-2 py-0 text-[11px] font-medium text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm" className="gap-1.5"
            onClick={() => setShowDrafts((v) => !v)}
          >
            {showDrafts ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showDrafts ? "Hide drafts" : "Show drafts"}
          </Button>
          {hasUnpublished && (
            <Button
              size="sm"
              onClick={() => publishMutation.mutate({ varieties })}
              disabled={publishMutation.isPending}
              className="gap-1.5 bg-green-700 text-white hover:bg-green-800 dark:bg-green-600"
            >
              {publishMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Publish All
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center"><PageLoader /></div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* ── Stage label column (sticky left) ── */}
          <div
            className="sticky left-0 z-20 flex shrink-0 flex-col border-r border-border bg-card"
            style={{ width: STAGE_COL_W }}
          >
            {/* Axis header spacer */}
            <div
              className="shrink-0 border-b border-border bg-muted/60 flex items-end px-3 pb-1.5"
              style={{ height: AXIS_H }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Stage
              </span>
            </div>
            {/* Stage rows */}
            {stageOrder.map((stage) => (
              <div
                key={stage}
                className="flex shrink-0 items-start justify-between border-b border-border bg-green-50/40 px-3 pt-2 dark:bg-green-900/10"
                style={{ height: stageHeights.get(stage) ?? 60 }}
              >
                <span className="text-xs font-semibold text-green-800 dark:text-green-300 leading-tight pt-0.5">
                  {stage}
                </span>
                <button
                  onClick={() => setAddingForStage(stage)}
                  className="mt-0.5 rounded p-0.5 text-muted-foreground hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/40"
                  title="Add activity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {/* Add new stage */}
            <div className="px-3 pt-2">
              <button
                onClick={() => setAddingForStage("New Stage")}
                className="flex w-full items-center gap-1 rounded-md border border-dashed border-border px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-green-500 hover:text-green-700 dark:hover:text-green-400"
              >
                <Plus className="h-3 w-3" /> Add stage
              </button>
            </div>
          </div>

          {/* ── Scrollable timeline area ── */}
          <div className="flex-1 overflow-auto">
            <div style={{ width: timelineW, minWidth: "100%" }}>
              {/* Day axis */}
              <div
                className="sticky top-0 z-10 border-b border-border bg-card"
                style={{ height: AXIS_H }}
              >
                <div className="relative h-full" style={{ width: timelineW }}>
                  {/* 10-day alternating bands (match row grid) */}
                  {bands.map((d) => (
                    <div
                      key={d}
                      className="absolute top-0 bottom-0 bg-green-100/90 dark:bg-green-900/25"
                      style={{ left: (d - minDay) * PX_PER_DAY, width: 10 * PX_PER_DAY }}
                    />
                  ))}
                  {/* Day 0 "Sowing" highlight */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-green-600 dark:bg-green-400 opacity-80"
                    style={{ left: (0 - minDay) * PX_PER_DAY }}
                  />
                  {/* Major ticks + labels */}
                  {majorTicks.map((d) => (
                    <div
                      key={d}
                      className="absolute bottom-0 flex flex-col items-center"
                      style={{ left: (d - minDay) * PX_PER_DAY }}
                    >
                      <span
                        className={`mb-1 ${
                          d === 0
                            ? "text-[12px] font-bold text-green-700 dark:text-green-400"
                            : "text-[11px] font-semibold text-muted-foreground"
                        }`}
                      >
                        {d === 0 ? "🌱 Sow" : d > 0 ? `+${d}` : d}
                      </span>
                      <div
                        className="w-px"
                        style={{
                          height: d === 0 ? 12 : 8,
                          backgroundColor: d === 0 ? "#16a34a" : "var(--border)",
                        }}
                      />
                    </div>
                  ))}
                  {/* Minor ticks */}
                  {minorTicks.map((d) => (
                    <div
                      key={d}
                      className="absolute bottom-0 w-px bg-border"
                      style={{ left: (d - minDay) * PX_PER_DAY, height: 4 }}
                    />
                  ))}
                </div>
              </div>

              {/* Stage rows */}
              {stageOrder.map((stage) => {
                const recs   = stageRecs.get(stage)!;
                const lanes  = stageLanes.get(stage)!;
                const rowH   = stageHeights.get(stage)!;
                return (
                  <div
                    key={stage}
                    className="relative border-b border-border"
                    style={{ height: rowH, width: timelineW }}
                  >
                    {/* 10-day alternating bands (same as axis) */}
                    {bands.map((d) => (
                      <div
                        key={d}
                        className="absolute top-0 bottom-0 bg-green-100/90 dark:bg-green-900/25"
                        style={{ left: (d - minDay) * PX_PER_DAY, width: 10 * PX_PER_DAY }}
                      />
                    ))}
                    {/* Sowing day vertical line */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-green-600/20 dark:bg-green-400/20"
                      style={{ left: (0 - minDay) * PX_PER_DAY }}
                    />
                    {/* Lane separator lines */}
                    {Array.from({ length: Math.max(...Array.from(lanes.values())) }, (_, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0 h-px bg-border/50"
                        style={{ top: ROW_PAD + (i + 1) * LANE_H }}
                      />
                    ))}
                    {/* Activity pills */}
                    {recs.map((r) => (
                      <ActivityPill
                        key={r.id}
                        record={r}
                        lane={lanes.get(r.id) ?? 0}
                        minDay={minDay}
                        selected={selectedId === r.id}
                        onSelect={() => setSelectedId(selectedId === r.id ? null : r.id)}
                        onUpdateDays={handleUpdateDays}
                        onHover={handleHover}
                        onHoverEnd={handleHoverEnd}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Legend bar ── */}
      {!isLoading && (
        <div className="flex shrink-0 items-center gap-3 overflow-x-auto border-t border-border bg-card px-4 py-2">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Type
          </span>
          {TYPE_CONFIGS.map(({ label, bar, border }) => (
            <div key={label} className="flex shrink-0 items-center gap-1">
              <div
                className="h-3.5 w-8 rounded-sm border"
                style={{ backgroundColor: bar, borderColor: border }}
              />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="h-3.5 w-8 rounded-sm border-2 border-dashed border-gray-400 bg-gray-100 dark:border-gray-600 dark:bg-gray-800" />
              <span className="text-[11px] text-muted-foreground">Draft</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="rounded bg-black/20 px-1 text-[9px] font-bold dark:bg-white/20">M</span>
              <span className="text-[11px] text-muted-foreground">Mandatory</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <GripHorizontal className="h-3 w-3" />
              Drag to move · edges to resize
            </div>
          </div>
        </div>
      )}

      {/* ── Tooltip ── */}
      {tooltip && <ActivityTooltip data={tooltip} />}

      {/* ── Edit / Add panel ── */}
      {(selectedId || addingForStage) && (
        <EditPanel
          record={selectedId ? selectedRecord : null}
          crop={decodedCrop}
          season={decodedSeason}
          varieties={varieties}
          stageName={addingForStage ?? selectedRecord?.stage_name ?? ""}
          onClose={closePanel}
          onDeleted={closePanel}
        />
      )}
    </div>
  );
}
