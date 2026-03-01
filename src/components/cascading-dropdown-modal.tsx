import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useFpcList, useShgList } from "@/hooks/useOptions";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CascadingDropdownModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Initial FPC when opening (e.g. current farmer FPC). */
  initialFpc?: string | null;
  /** Initial SHG when opening (e.g. current farmer SHG). */
  initialShg?: string | null;
  /** Called when user confirms. Pass selected FPC and SHG (empty string if cleared). */
  onSave: (fpc: string, shg: string) => void;
  /** Optional: show saving state on the confirm button. */
  saving?: boolean;
};

function CascadeSelectRow({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className={cn("space-y-1", disabled && "opacity-50")}>
      <Label className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
        {label}
      </Label>
      <Select
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`— Select ${label} —`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Modal with cascading dropdowns: FPC (step 1) then SHG (step 2, filtered by FPC).
 * Uses /options/fpc and /options/shg?fpc=... for options.
 */
export function CascadingDropdownModal({
  open,
  onOpenChange,
  initialFpc = "",
  initialShg = "",
  onSave,
  saving = false,
}: CascadingDropdownModalProps) {
  const [fpc, setFpc] = useState("");
  const [shg, setShg] = useState("");

  const { data: fpcList = [] } = useFpcList(open);
  const { data: shgList = [] } = useShgList(fpc || null, open && !!fpc);

  useEffect(() => {
    if (open) {
      setFpc(initialFpc?.trim() ?? "");
      setShg(initialShg?.trim() ?? "");
    }
  }, [open, initialFpc, initialShg]);

  const handleFpcChange = (v: string) => {
    setFpc(v);
    setShg("");
  };

  const handleSave = () => {
    onSave(fpc, shg);
    onOpenChange(false);
  };

  const allSelected = !!fpc && !!shg;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle>Edit FPC &amp; SHG</DialogTitle>
          <DialogDescription>Select FPC first, then SHG. Options depend on your choice.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <CascadeSelectRow
            label="FPC"
            options={fpcList}
            value={fpc}
            onChange={handleFpcChange}
            disabled={false}
          />
          <CascadeSelectRow
            label="SHG"
            options={shgList}
            value={shg}
            onChange={setShg}
            disabled={!fpc}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!allSelected || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
