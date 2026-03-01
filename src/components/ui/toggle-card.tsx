import { cn } from "@/lib/utils";

type ToggleCardProps = {
  value: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
  ariaLabel: string;
};

export function ToggleCard({ value, onToggle, onLabel, offLabel, ariaLabel }: ToggleCardProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md border border-input bg-muted/30 px-3 py-2 transition-colors duration-200"
      )}
    >
      <span
        className={cn(
          "text-sm font-medium transition-colors duration-200",
          value ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {value ? onLabel : offLabel}
      </span>

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full border transition-all duration-300",
          value
            ? "bg-primary border-primary shadow-[0_0_8px_rgba(34,197,94,0.4)]"
            : "bg-muted border-input"
        )}
        aria-pressed={value}
        aria-label={ariaLabel}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full shadow transition-all duration-300",
            value
              ? "translate-x-5 bg-background"
              : "translate-x-1 bg-background"
          )}
        />
      </button>
    </div>
  );
}