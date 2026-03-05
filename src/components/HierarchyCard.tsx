import { useState } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HierarchyItem {
  id: string;
  label: string;
  count?: number;
}

export interface HierarchyCardProps {
  icon: string;
  label: string;
  items: HierarchyItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function HierarchyCard({
  icon,
  label,
  items,
  selectedId,
  onSelect,
  onClear,
  isLoading = false,
  disabled = false,
}: HierarchyCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const selectedItem = items.find((i) => i.id === selectedId);
  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const hasMoreThan20 = items.length > 20;

  return (
    <div className="rounded-lg border border-white/20 bg-gradient-to-br from-black via-slate-950 to-black overflow-hidden min-w-[220px] shadow-lg hover:border-white/30 transition-colors">
      <div className="px-4 py-3 border-b border-white/10 bg-black">
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <span className="text-lg">{icon}</span>
          {label}
        </span>
      </div>

      <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
        {/* Search input (shown when more than 20 items) */}
        {hasMoreThan20 && (
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border border-white/15 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
            />
          </div>
        )}

        {isLoading ? (
          <div className="text-xs text-slate-500 text-center py-4">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-4">No items</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-4">No matches</div>
        ) : (
          <>
            {filteredItems.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id);
                    setSearchQuery("");
                  }}
                  disabled={disabled}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs transition-all",
                    isSelected
                      ? "border-white/40 bg-white/10 text-white font-medium shadow-md"
                      : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/8 hover:border-white/25"
                  )}
                >
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.count != null && (
                    <span className={cn("ml-2 text-xs font-semibold", isSelected ? "text-indigo-300" : "text-slate-400")}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
            {!searchQuery && items.length > 20 && (
              <div className="px-3 py-2 text-center border border-white/10 bg-white/3 rounded-lg">
                <span className="text-xs text-slate-500">+{items.length - 20} more items</span>
              </div>
            )}
          </>
        )}
      </div>

      {selectedItem && (
        <div className="px-3 py-2 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <span className="text-xs text-slate-400">Selected:</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white truncate max-w-[100px]">{selectedItem.label}</span>
            <button
              onClick={onClear}
              className="text-slate-400 hover:text-white transition-colors"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
