import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCropAdvisoryTemplates, useCopyPop } from "@/hooks/useCropAdvisoryAdmin";
import type { CropAdvisoryTemplate } from "@/api/crop-advisory-admin";


const STEPS = ["Basic Details", "Origin", "Varieties", "Confirm"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              i < current
                ? "bg-green-600 text-white dark:bg-green-500"
                : i === current
                ? "bg-green-700 text-white dark:bg-green-600"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i < current ? "✓" : i + 1}
          </div>
          <span
            className={`hidden text-xs sm:inline ${
              i === current ? "font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-6 rounded ${i < current ? "bg-green-600 dark:bg-green-500" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

interface WizardState {
  crop: string;
  season: string;
  origin: "blank" | "copy";
  sourceCrop: string;
  sourceSeason: string;
  sourceVarieties: string[];
  stageFilter: string[];
  varieties: string[];
  newVariety: string;
}

const INITIAL: WizardState = {
  crop: "",
  season: "",
  origin: "blank",
  sourceCrop: "",
  sourceSeason: "",
  sourceVarieties: [],
  stageFilter: [],
  varieties: [],
  newVariety: "",
};

// ── Step 1: Basic Details ────────────────────────────────────────────────────
function Step1Basic({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (s: Partial<WizardState>) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Name the crop and season for this Plan of Practice.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Crop name</Label>
          <Input
            value={state.crop}
            onChange={(e) => onChange({ crop: e.target.value })}
            placeholder="e.g. Maize, Wheat, Rice"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Season</Label>
          <Input
            value={state.season}
            onChange={(e) => onChange({ season: e.target.value })}
            placeholder="e.g. Kharif, Rabi"
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Origin ───────────────────────────────────────────────────────────
function Step2Origin({
  state,
  onChange,
  templates,
}: {
  state: WizardState;
  onChange: (s: Partial<WizardState>) => void;
  templates: CropAdvisoryTemplate[];
}) {
  const selectedTemplate = state.sourceCrop && state.sourceSeason
    ? templates.find((t) => t.crop === state.sourceCrop && t.season === state.sourceSeason)
    : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Start from scratch or copy activities from an existing POP.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["blank", "copy"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => onChange({ origin: opt })}
            className={`rounded-xl border p-4 text-left transition-colors ${
              state.origin === opt
                ? "border-green-500 bg-green-50"
                : "border-border hover:bg-muted/40"
            }`}
          >
            <p className="font-medium text-foreground capitalize">{opt === "blank" ? "Start blank" : "Copy from existing"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {opt === "blank"
                ? "Build the POP from scratch, activity by activity."
                : "Duplicate an existing POP and edit from there."}
            </p>
          </button>
        ))}
      </div>

      {state.origin === "copy" && (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm font-medium text-foreground">Select source POP</p>
          <div className="grid max-h-56 gap-2 overflow-y-auto">
            {templates.map((t) => (
              <button
                key={`${t.crop}::${t.season}`}
                onClick={() =>
                  onChange({
                    sourceCrop: t.crop,
                    sourceSeason: t.season,
                    sourceVarieties: [],
                    stageFilter: [],
                  })
                }
                className={`flex items-center justify-between rounded-lg border p-2.5 text-sm transition-colors ${
                  state.sourceCrop === t.crop && state.sourceSeason === t.season
                    ? "border-green-500 bg-green-50"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <span>
                  {t.crop} — {t.season}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t.total_groups} {t.total_groups === 1 ? "group" : "groups"}
                </span>
              </button>
            ))}
          </div>

          {selectedTemplate && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Select variety group to copy from</p>
              {selectedTemplate.variety_groups.map((g) => {
                const key = [...g.varieties].sort().join("|");
                const isSelected = [...state.sourceVarieties].sort().join("|") === key;
                return (
                  <button
                    key={key}
                    onClick={() => onChange({ sourceVarieties: g.varieties })}
                    className={`flex w-full items-center justify-between rounded-lg border p-2 text-xs transition-colors ${
                      isSelected ? "border-green-500 bg-green-50" : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <span>{g.varieties.join(", ")}</span>
                    <span className="text-muted-foreground">{g.total} activities</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Varieties ────────────────────────────────────────────────────────
function Step3Varieties({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (s: Partial<WizardState>) => void;
}) {
  function addVariety() {
    const v = state.newVariety.trim();
    if (!v || state.varieties.includes(v)) return;
    onChange({ varieties: [...state.varieties, v], newVariety: "" });
  }

  function removeVariety(v: string) {
    onChange({ varieties: state.varieties.filter((x) => x !== v) });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add the variety names that share this POP. Varieties with identical practices can be grouped together.
      </p>
      <div className="flex gap-2">
        <Input
          value={state.newVariety}
          onChange={(e) => onChange({ newVariety: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && addVariety()}
          placeholder="e.g. Bio 9544"
          className="flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={addVariety}
          disabled={!state.newVariety.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {state.varieties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {state.varieties.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 pl-3 pr-1.5 py-0.5 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"
            >
              {v}
              <button onClick={() => removeVariety(v)} className="rounded-full hover:bg-green-200 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {state.varieties.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add at least one variety to continue.
        </p>
      )}
    </div>
  );
}

// ── Step 4: Confirm ──────────────────────────────────────────────────────────
function Step4Confirm({ state }: { state: WizardState }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Review and confirm your new POP.</p>
      <div className="rounded-xl border border-border p-4 space-y-3 text-sm">
        <Row label="Crop" value={state.crop} />
        <Row label="Season" value={state.season} />
        <Row label="Varieties" value={state.varieties.join(", ") || "—"} />
        <Row
          label="Origin"
          value={
            state.origin === "blank"
              ? "Start blank"
              : `Copy from ${state.sourceCrop} / ${state.sourceSeason} (${state.sourceVarieties.join(", ")})`
          }
        />
      </div>
      {state.origin === "copy" && (
        <p className="text-xs text-muted-foreground rounded-md bg-amber-50 border border-amber-200 p-2">
          Copied activities will be saved as <strong>drafts</strong> — review and publish them on the timeline editor.
        </p>
      )}
      {state.origin === "blank" && (
        <p className="text-xs text-muted-foreground rounded-md p-2 border border-border">
          You'll land on the empty timeline editor to add activities one by one.
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

// ── Wizard shell ─────────────────────────────────────────────────────────────
export function AddCropWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL);

  const { data: templates = [] } = useCropAdvisoryTemplates();
  const copyPop = useCopyPop();

  function patch(s: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...s }));
  }

  function canNext() {
    if (step === 0) return !!state.crop.trim() && !!state.season.trim();
    if (step === 1)
      return state.origin === "blank" || (!!state.sourceCrop && state.sourceVarieties.length > 0);
    if (step === 2) return state.varieties.length > 0;
    return true;
  }

  async function handleFinish() {
    if (state.origin === "copy") {
      await copyPop.mutateAsync({
        sourceCrop: state.sourceCrop,
        sourceSeason: state.sourceSeason,
        sourceVarieties: state.sourceVarieties,
        targetCrop: state.crop,
        targetSeason: state.season,
        targetVarieties: state.varieties,
      });
    }
    navigate(
      `/crop-advisory/${encodeURIComponent(state.crop)}/${encodeURIComponent(state.season)}/timeline?varieties=${encodeURIComponent(state.varieties.join(","))}`
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/crop-advisory">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Cancel
          </Button>
        </Link>
        <h2 className="text-xl font-semibold text-foreground">Add New POP</h2>
      </div>

      <div className="mb-6">
        <StepIndicator current={step} />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 font-semibold text-foreground">{STEPS[step]}</h3>

        {step === 0 && <Step1Basic state={state} onChange={patch} />}
        {step === 1 && <Step2Origin state={state} onChange={patch} templates={templates} />}
        {step === 2 && <Step3Varieties state={state} onChange={patch} />}
        {step === 3 && <Step4Confirm state={state} />}

        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="gap-1.5 bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleFinish}
              disabled={copyPop.isPending}
              className="gap-1.5 bg-green-700 text-white hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700"
            >
              {copyPop.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create POP
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
