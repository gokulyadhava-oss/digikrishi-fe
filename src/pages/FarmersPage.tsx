import { useEffect, useRef, useCallback, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { PageLoader } from "@/components/ui/loader";
import { Plus, Search, ChevronLeft, ChevronRight, Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { FarmerListSort } from "@/types";

const SORT_COLUMNS: { key: FarmerListSort["sortBy"]; label: string }[] = [
  { key: "farmer_code", label: "Code" },
  { key: "name", label: "Name" },
  { key: "village", label: "Village / District" },
];

export function FarmersPage() {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [pagination, setPagination] = useAtom(paginationAtom);
  const [listFilters, setListFilters] = useAtom(farmerListFiltersAtom);
  const [listSort, setListSort] = useAtom(farmerListSortAtom);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

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

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

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

  const activeFilterCount = [
    listFilters.has_ration_card,
    listFilters.has_profile_pic,
    listFilters.has_bank_details,
    listFilters.has_document,
    listFilters.has_fhc,
    listFilters.has_shg,
  ].filter(Boolean).length;

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
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or farmer code"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative" ref={filterRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterOpen((o) => !o)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              {filterOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-md border bg-popover p-2 shadow-md">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Show farmers who have</p>
                  <div className="flex flex-col gap-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={!!listFilters.has_ration_card}
                        onCheckedChange={(c) => toggleFilter("has_ration_card", c === true)}
                      />
                      <span className="text-sm">Has ration card</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={!!listFilters.has_profile_pic}
                        onCheckedChange={(c) => toggleFilter("has_profile_pic", c === true)}
                      />
                      <span className="text-sm">Has profile pic</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={!!listFilters.has_bank_details}
                        onCheckedChange={(c) => toggleFilter("has_bank_details", c === true)}
                      />
                      <span className="text-sm">Has bank details</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={!!listFilters.has_document}
                        onCheckedChange={(c) => toggleFilter("has_document", c === true)}
                      />
                      <span className="text-sm">Has document</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={!!listFilters.has_fhc}
                        onCheckedChange={(c) => toggleFilter("has_fhc", c === true)}
                      />
                      <span className="text-sm">Has FHC</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={!!listFilters.has_shg}
                        onCheckedChange={(c) => toggleFilter("has_shg", c === true)}
                      />
                      <span className="text-sm">Has SHG</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
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
                      <TableCell>
                        {f.FarmerAddress
                          ? [f.FarmerAddress.village, f.FarmerAddress.district]
                              .filter(Boolean)
                              .join(" / ") || "—"
                          : "—"}
                      </TableCell>
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
