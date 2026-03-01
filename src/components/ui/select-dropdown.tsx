import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectDropdownOption = { value: string; label: string };

type SelectDropdownProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectDropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  "data-testid"?: string;
};

/**
 * Reusable select dropdown built on Radix Select. Pass options (value/label);
 * when options are loading, pass empty array and optionally disable.
 */
export function SelectDropdown({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  disabled = false,
  className,
  triggerClassName,
  ...rest
}: SelectDropdownProps) {
  return (
    <Select value={value || ""} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", triggerClassName)} data-testid={rest["data-testid"]}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={className}>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
