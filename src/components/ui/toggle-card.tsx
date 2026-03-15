import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type ToggleCardProps = {
  value: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
  ariaLabel: string;
};

// ─── Component ────────────────────────────────────────────────────────────────
export function ToggleCard({
  value,
  onToggle,
  onLabel,
  offLabel,
  ariaLabel,
}: ToggleCardProps) {
  return (
    <div className="flex items-center justify-between rounded-md border border-input bg-muted/10 px-3 py-2">
      <span
        className={cn(
          "text-sm font-medium",
          value ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {value ? onLabel : offLabel}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={ariaLabel}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors",
          value
            ? "bg-primary border-primary"
            : "bg-muted border-muted-foreground/40"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform",
            value ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}