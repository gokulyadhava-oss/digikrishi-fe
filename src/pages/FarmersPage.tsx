import { useEffect, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useAtom } from "jotai";
import {
  searchQueryAtom,
  paginationAtom,
  farmerListFiltersAtom,
  farmerListSortAtom,
} from "@/atoms";
import { useFarmers } from "@/hooks/useFarmers";
import { useSearchFarmers } from "@/hooks/useSearchFarmers";
import { useFpcList, useShgList } from "@/hooks/useOptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { PageLoader } from "@/components/ui/loader";
import { Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { HierarchyCard } from "@/components/HierarchyCard";
import type { FarmerListSort } from "@/types";

const SORT_COLUMNS: { key: FarmerListSort["sortBy"]; label: string }[] = [
  { key: "farmer_code", label: "Code" },
  { key: "name", label: "Name" },
  { key: "fpc", label: "FPC" },
  { key: "shg", label: "SHG" },
];

export function FarmersPage() {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [pagination, setPagination] = useAtom(paginationAtom);
  const [listFilters, setListFilters] = useAtom(farmerListFiltersAtom);
  const [listSort, setListSort] = useAtom(farmerListSortAtom);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const { data: fpcList = [], isLoading: fpcLoading } = useFpcList();
  const { data: shgList = [], isLoading: shgLoading } = useShgList(listFilters.fpc);

  const hasSearch = searchQuery.trim().length > 0;
  const listQuery = useFarmers();
  const searchQueryResult = useSearchFarmers();

  // Reset to page 1 when search query, filters, or sort change
  useEffect(() => {
    setPagination((p) => (p.page === 1 ? p : { ...p, page: 1 }));
  }, [searchQuery, setPagination]);

  useEffect(() => {
    setPagination((p) => (p.page === 1 ? p : { ...p, page: 1 }));
  }, [listFilters, listSort, setPagination]);


  const toggleFilter = useCallback((key: keyof typeof listFilters, value: boolean) => {
    setListFilters((f) => ({ ...f, [key]: value || undefined }));
  }, [setListFilters]);

  const handleSort = useCallback(
    (column: FarmerListSort["sortBy"]) => {
      if (!column) return;
      setListSort((s) => ({
        sortBy: column,
        sortOrder: s.sortBy === column && s.sortOrder === "asc" ? "desc" : "asc",
      }));
    },
    [setListSort]
  );

  const { data: listData, isLoading: listLoading } = listQuery;
  const { data: searchData, isLoading: searchLoading } = searchQueryResult;

  const farmers = hasSearch ? searchData?.results ?? [] : listData?.farmers ?? [];
  const total = hasSearch ? searchData?.total ?? 0 : listData?.total ?? 0;
  const isLoading = hasSearch ? searchLoading : listLoading;
  const totalPages = Math.ceil(total / pagination.limit) || 1;
  const canPrev = pagination.page > 1;
  const canNext = pagination.page < totalPages;

  function goPrev() {
    setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }));
  }
  function goNext() {
    setPagination((p) => ({ ...p, page: Math.min(totalPages, p.page + 1) }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Farmers</h2>
        <Link to="/farmers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add farmer
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-4 space-y-4">
          {/* Search + Advanced Filter (as icon) row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, farmer code or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="gap-2"
              title={advancedOpen ? "Hide advanced filters" : "Show advanced filters"}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* FPC → SHG Visual Hierarchy + Status Summary (HIDDEN by default) */}
          {advancedOpen && (
          <div className="flex gap-3 items-start overflow-x-auto pb-2">
            <HierarchyCard
              icon="🏢"
              label="FPC"
              items={fpcList.map((fpc) => ({ id: fpc, label: fpc }))}
              selectedId={listFilters.fpc || null}
              onSelect={(fpc) => {
                setListFilters((f) => ({ ...f, fpc, shg: null }));
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              onClear={() => {
                setListFilters((f) => ({ ...f, fpc: null, shg: null }));
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              isLoading={fpcLoading}
            />

            {/* Dashed connector arrow */}
            <div className="flex flex-col items-center justify-center flex-shrink-0 py-6">
              <div
                className={cn(
                  "w-8 border-t-2 border-dashed transition-all duration-300",
                  listFilters.fpc ? "border-white/40" : "border-white/15"
                )}
              />
              <span className={cn("text-xs mt-1 transition-all duration-300", listFilters.fpc ? "text-white" : "text-slate-600")}>
                ›
              </span>
            </div>

            <HierarchyCard
              icon="👥"
              label={listFilters.fpc ? `SHGs in ${listFilters.fpc.split(" ")[0]}` : "SHG"}
              items={shgList.map((shg) => ({ id: shg, label: shg }))}
              selectedId={listFilters.shg || null}
              onSelect={(shg) => {
                setListFilters((f) => ({ ...f, shg }));
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              onClear={() => {
                setListFilters((f) => ({ ...f, shg: null }));
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              isLoading={shgLoading}
              disabled={!listFilters.fpc}
            />

            {/* Dashed connector arrow 2 */}
            <div className="flex flex-col items-center justify-center flex-shrink-0 py-6">
              <div
                className={cn(
                  "w-8 border-t-2 border-dashed transition-all duration-300",
                  listFilters.shg ? "border-white/40" : "border-white/15"
                )}
              />
              <span className={cn("text-xs mt-1 transition-all duration-300", listFilters.shg ? "text-white" : "text-slate-600")}>
                ›
              </span>
            </div>

            {/* Farmers Status Summary Card */}
            <div className="flex-1 min-w-0 rounded-lg border border-white/20 bg-gradient-to-br from-black via-slate-950 to-black overflow-hidden shadow-lg hover:border-white/30 transition-colors">
              <div className="px-4 py-3 border-b border-white/10 bg-black">
                <span className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
                  👨‍🌾 Farmers {listFilters.fpc ? `in ${listFilters.fpc.split(" ")[0]}` : ""}
                </span>
              </div>
              <div className="p-4 text-center">
                <p className="text-3xl font-bold text-white">{farmers.length}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {total > farmers.length ? `${total} total` : "listed"}
                </p>
              </div>
            </div>
          </div>
          )}

          {/* Show farmers who have - Filters (ONLY when FPC or SHG selected) */}
          {advancedOpen && (
            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="mb-3 text-xs font-semibold text-white uppercase tracking-wider">Show farmers who have</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
                <label className="flex cursor-pointer items-center gap-2 p-2.5 rounded-lg border border-white/15 hover:border-white/25 hover:bg-white/8 transition-all">
                  <Checkbox
                    checked={!!listFilters.has_ration_card}
                    onCheckedChange={(c) => toggleFilter("has_ration_card", c === true)}
                  />
                  <span className="text-xs text-slate-300">Ration card</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 p-2.5 rounded-lg border border-white/15 hover:border-white/25 hover:bg-white/8 transition-all">
                  <Checkbox
                    checked={!!listFilters.has_profile_pic}
                    onCheckedChange={(c) => toggleFilter("has_profile_pic", c === true)}
                  />
                  <span className="text-xs text-slate-300">Profile pic</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 p-2.5 rounded-lg border border-white/15 hover:border-white/25 hover:bg-white/8 transition-all">
                  <Checkbox
                    checked={!!listFilters.has_bank_details}
                    onCheckedChange={(c) => toggleFilter("has_bank_details", c === true)}
                  />
                  <span className="text-xs text-slate-300">Bank details</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 p-2.5 rounded-lg border border-white/15 hover:border-white/25 hover:bg-white/8 transition-all">
                  <Checkbox
                    checked={!!listFilters.has_document}
                    onCheckedChange={(c) => toggleFilter("has_document", c === true)}
                  />
                  <span className="text-xs text-slate-300">Any document</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 p-2.5 rounded-lg border border-white/15 hover:border-white/25 hover:bg-white/8 transition-all">
                  <Checkbox
                    checked={!!listFilters.has_fhc}
                    onCheckedChange={(c) => toggleFilter("has_fhc", c === true)}
                  />
                  <span className="text-xs text-slate-300">FHC</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 p-2.5 rounded-lg border border-white/15 hover:border-white/25 hover:bg-white/8 transition-all">
                  <Checkbox
                    checked={!!listFilters.has_shg}
                    onCheckedChange={(c) => toggleFilter("has_shg", c === true)}
                  />
                  <span className="text-xs text-slate-300">SHG</span>
                </label>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoader />
          ) : farmers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No farmers found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {SORT_COLUMNS.map(({ key, label }) => {
                      const isActive = listSort.sortBy === key;
                      return (
                        <TableHead key={key}>
                          <button
                            type="button"
                            onClick={() => handleSort(key)}
                            className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
                          >
                            {label}
                            {isActive && listSort.sortOrder === "asc" && (
                              <ArrowUp className="h-4 w-4" />
                            )}
                            {isActive && listSort.sortOrder === "desc" && (
                              <ArrowDown className="h-4 w-4" />
                            )}
                            {!isActive && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                          </button>
                        </TableHead>
                      );
                    })}
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {farmers.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.farmer_code}</TableCell>
                      <TableCell>{f.name}</TableCell>
                      <TableCell className="text-muted-foreground">{f.FarmerProfileDetail?.fpc ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{f.FarmerProfileDetail?.shg ?? "—"}</TableCell>
                      <TableCell>
                        <Link to={`/farmers/${f.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goPrev} disabled={!canPrev}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goNext} disabled={!canNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
