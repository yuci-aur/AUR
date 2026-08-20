"use client";

import React, { useState, useMemo, useEffect, useDeferredValue } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  CheckSquare,
  Square,
  Globe,
  X,
  FilterX,
  Lock,
} from "lucide-react";
import type { University } from "../types";
import { searchUniversities, MAX_SEARCH_PAGE_SIZE } from "../lib/universities";
import { useUniversityData } from "./data/UniversityDataProvider";
import { useAuthGate } from "./auth/AuthGate";
import { PREVIEW_LIMIT } from "./navigation/config";
import { useSidebar } from "./navigation/SidebarContext";
import MultiSelectDropdown from "./ui/MultiSelectDropdown";

interface RankingsEngineProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  selectedUniIds: string[];
  onToggleCompare: (id: string) => void;
  onUniversitySelect: (id: string) => void;
}

/**
 * Rows fetched per server-side country or search query. Set to the API's cap so
 * a filtered result arrives complete: at 50 a search for "IIT" or a country
 * filter silently dropped everything past the 50th match, which reads as
 * missing data rather than as a page limit.
 */
const MAX_FILTER_ROWS = MAX_SEARCH_PAGE_SIZE;

/**
 * Renders a 0-100 indicator. Many records in the long tail carry no indicator
 * data, which reaches the table as 0; showing "0" there reads as a measured
 * score of zero rather than "not rated", so it is dashed out instead.
 */
function renderMetric(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return <span className="aur-tabular text-slate-300">—</span>;
  }
  return (
    <span className="font-mono text-[var(--aur-text-secondary)] aur-tabular">
      {value.toFixed(0)}
    </span>
  );
}

// Preset weights
const DEFAULT_WEIGHTS = {
  citations: 25,
  research: 25,
  employability: 25,
  teaching: 25,
};

export default function RankingsEngine({
  searchQuery,
  onSearchQueryChange,
  selectedUniIds,
  onToggleCompare,
  onUniversitySelect,
}: RankingsEngineProps) {
  const {
    universities,
    totalCount,
    totalCountKnown,
    loadingMore,
    hasMore,
    error: dataError,
    loadMore,
  } = useUniversityData();
  const { isAuthenticated, promptSignIn } = useAuthGate();
  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aur-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filters } = useSidebar();

  // 1. Core State
  const [sorting, setSorting] = useState<SortingState>([{ id: "calculatedRank", desc: false }]);
  const [locations, setLocations] = useState<string[]>([]);
  const [isWeightsDrawerOpen, setIsWeightsDrawerOpen] = useState(false);

  // Custom metric weights state
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  // 2. Deserialize state from URL Search Params on mount
  useEffect(() => {
    const locParam = searchParams.get("locations");
    const searchParam = searchParams.get("search");

    const wCit = searchParams.get("w_cit");
    const wRes = searchParams.get("w_res");
    const wEmp = searchParams.get("w_emp");
    const wTeach = searchParams.get("w_teach");

    if (locParam) setLocations(locParam.split(","));
    if (searchParam) onSearchQueryChange(searchParam);

    if (wCit || wRes || wEmp || wTeach) {
      setWeights({
        citations: wCit ? parseInt(wCit) : DEFAULT_WEIGHTS.citations,
        research: wRes ? parseInt(wRes) : DEFAULT_WEIGHTS.research,
        employability: wEmp ? parseInt(wEmp) : DEFAULT_WEIGHTS.employability,
        teaching: wTeach ? parseInt(wTeach) : DEFAULT_WEIGHTS.teaching,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Serialize state back to URL query strings smoothly
  // We use window.history.replaceState to prevent Next.js from triggering heavy  flushes or re-renders
  const serializeStateToUrl = (
    newSearch: string,
    newLocs: string[],
    newWeights: typeof weights
  ) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newLocs.length > 0) params.set("locations", newLocs.join(","));


    // Only serialize  weights if they differ from default
    if (JSON.stringify(newWeights) !== JSON.stringify(DEFAULT_WEIGHTS)) {
      params.set("w_cit", newWeights.citations.toString());
      params.set("w_res", newWeights.research.toString());
      params.set("w_emp", newWeights.employability.toString());
      params.set("w_teach", newWeights.teaching.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `?view=rankings&${queryString}` : "?view=rankings";
    window.history.replaceState({ ...window.history.state, as: url, url }, "", url);
  };

  const handleSearchChange = (val: string) => {
    onSearchQueryChange(val);
    serializeStateToUrl(val, locations, weights);
  };

  const handleLocationToggle = (loc: string) => {
    const next = locations.includes(loc)
      ? locations.filter((l) => l !== loc)
      : [...locations, loc];
    setLocations(next);
    serializeStateToUrl(searchQuery, next, weights);
  };

  const handleWeightChange = (key: keyof typeof weights, val: number) => {
    const next = { ...weights, [key]: val };
    setWeights(next);
    serializeStateToUrl(searchQuery, locations, next);
  };

  const handleResetFilters = () => {
    setLocations([]);
    onSearchQueryChange("");
    setWeights(DEFAULT_WEIGHTS);
    router.replace("?view=rankings");
  };

  // Country and search matches are fetched from the database rather than
  // filtered out of `universities`, which only holds the pages loaded so far
  // (20 at a time). Most countries — and most search terms — have no
  // institution in the global top 20, so filtering the loaded rows would report
  // "no institutions match" for them.
  const [countryRows, setCountryRows] = useState<University[] | null>(null);
  const [countryLoading, setCountryLoading] = useState(false);
  const countryKey = locations.join(",");
  const trimmedSearch = searchQuery.trim();

  useEffect(() => {
    if (locations.length === 0 && !trimmedSearch) {
      setCountryRows(null);
      setCountryLoading(false);
      return;
    }

    let active = true;
    setCountryLoading(true);

    // The API filters by a single country, so a multi-select fans out into one
    // request per country and merges the results. With no country selected the
    // search runs once across the whole dataset.
    const countries = countryKey ? countryKey.split(",") : [""];

    // Debounced so each keystroke does not issue a query.
    const timer = setTimeout(() => {
      Promise.all(
        countries.map((country) =>
          searchUniversities(
            { country: country || undefined, search: trimmedSearch || undefined },
            0,
            MAX_FILTER_ROWS,
          )
            .then((page) => page.universities)
            .catch(() => [] as University[])
        )
      )
        .then((pages) => {
          if (!active) return;
          const merged = new Map<string, University>();
          for (const university of pages.flat()) {
            merged.set(university.id, university);
          }
          setCountryRows(Array.from(merged.values()));
        })
        .finally(() => {
          if (active) setCountryLoading(false);
        });
    }, trimmedSearch ? 300 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
    // `countryKey` is the stable serialization of `locations`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryKey, trimmedSearch]);

  // 4. Data Processing: Client-Side Custom Weights Recalculation Engine
  // When a country is selected the source rows come from the database query
  // rather than the loaded pages, so institutions outside the loaded top 20
  // still appear.
  const isServerFiltered = countryRows !== null;
  const sourceUniversities = countryRows ?? universities;

  const processedData = useMemo(() => {
    const totalWeight =
      weights.citations +
      weights.research +
      weights.employability +
      weights.teaching;

    // Apply  formula weights to recalculate scores dynamically
    const recalculated = sourceUniversities.map((uni) => {
      let calculatedScore = uni.overall;
      if (totalWeight > 0) {
        calculatedScore =
          (uni.citations * weights.citations +
            uni.research * weights.research +
            uni.employability * weights.employability +
            uni.teaching * weights.teaching) /
          totalWeight;
      }

      return {
        ...uni,
        calculatedScore: Math.round(calculatedScore * 10) / 10,
      };
    });

    // Re-rank based on recalculated scores. For a country subset the position
    // within the subset would be misleading (every country would start at 1),
    // so the institution's true dataset rank is kept instead.
    // Unrated records all compute to 0 and would otherwise tie in arbitrary
    // order; the dataset rank keeps them in a stable, meaningful sequence.
    const sorted = [...recalculated].sort(
      (a, b) =>
        b.calculatedScore - a.calculatedScore ||
        (a.history[0] ?? Infinity) - (b.history[0] ?? Infinity)
    );
    return sorted.map((uni, index) => ({
      ...uni,
      calculatedRank: isServerFiltered ? uni.history[0] ?? index + 1 : index + 1,
    }));
  }, [weights, sourceUniversities, isServerFiltered]);

  // 5. Apply filters
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const filteredData = useMemo(() => {
    return processedData.filter((uni) => {
      // 1. Search Query. When rows came from the server they are already
      // filtered by the same term, and re-checking here would drop acronym
      // matches ("IIT" is not a substring of "Indian Institute of Technology").
      const query = (deferredSearchQuery || "").toLowerCase();
      const matchesSearch =
        isServerFiltered ||
        query === "" ||
        uni.name.toLowerCase().includes(query) ||
        uni.location.toLowerCase().includes(query);

      // 2. Country (combine locations state and filters.country)
      const matchesLoc =
        (locations.length === 0 || locations.includes(uni.location)) &&
        (filters.country === "" || uni.location === filters.country);

      // 3. Subject — sidebar filter only; the in-card subject dropdown was removed.
      const matchesSub =
        filters.subjects.length === 0 ||
        uni.subjects.some((sub) => filters.subjects.includes(sub));

      // 5. QS Rank Range (calculatedRank is from processedData).
      // Under a server-side country or search filter the ranks are true dataset
      // positions, which run well past the slider's default [1, 50] span
      // (IIT Delhi is #53). Applying that default —
      // which the user reads as "no restriction", since it is the full span —
      // would hide every institution ranked below 50 and empty the table.
      const rank = uni.calculatedRank;
      const rankFilterActive =
        !isServerFiltered || filters.qsRange[0] !== 1 || filters.qsRange[1] !== 50;
      const matchesRank =
        !rankFilterActive ||
        (rank >= filters.qsRange[0] && rank <= filters.qsRange[1]);

      // 6. Tuition Range
      const tuitionVal = parseInt(uni.tuition.replace(/[^0-9]/g, "")) || 0;
      const matchesTuition = tuitionVal >= filters.tuitionRange[0] && tuitionVal <= filters.tuitionRange[1];

      // 7. Public / Private
      let matchesType = true;
      if (filters.isPublic !== null) {
        // Prefer data-driven flag if present; fall back to legacy ID-based rule for compatibility.
        const legacyIsPublic = !["akfa-univ", "tashkent-webster", "yonsei", "korea-univ"].includes(uni.id);
        const isPublic = typeof uni.isPublic === "boolean" ? uni.isPublic : legacyIsPublic;
        matchesType = isPublic === filters.isPublic;
      }

      // 8. Scholarship Only
      let matchesScholarship = true;
      if (filters.scholarshipOnly) {
        // Prefer data-driven flag if present; fall back to legacy ID-based rule for compatibility.
        const legacyHasScholarship = ["tsinghua", "nus", "peking", "tokyo", "samarkand-med", "tashkent-med", "akfa-univ", "malaya"].includes(uni.id);
        const hasScholarship =
          typeof uni.hasScholarship === "boolean" ? uni.hasScholarship : legacyHasScholarship;
        matchesScholarship = hasScholarship;
      }

      return (
        matchesSearch &&
        matchesLoc &&
        matchesSub &&
        matchesRank &&
        matchesTuition &&
        matchesType &&
        matchesScholarship
      );
    });
  }, [processedData, deferredSearchQuery, locations, filters, isServerFiltered]);

  // Only the Firestore pages requested so far are processed in the browser.
  const isPreviewCapped =
    !isAuthenticated && (hasMore || totalCount > universities.length);
  const previewData = useMemo(
    () => (isPreviewCapped ? filteredData.slice(0, PREVIEW_LIMIT) : filteredData),
    [filteredData, isPreviewCapped]
  );

  // 6. Country filter options.
  // The list must cover every country in the dataset, not just those appearing
  // in the pages loaded so far (20 at a time), so it is fetched from the API and
  // merged with whatever the loaded rows already show as a fallback.
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/data/misc?resource=university-countries")
      .then((response) => {
        if (!response.ok) throw new Error("Countries unavailable.");
        return response.json() as Promise<string[]>;
      })
      .then((list) => {
        if (active) setCountryOptions(list);
      })
      .catch(() => {
        // Non-fatal: fall back to countries seen in the loaded universities.
      });
    return () => {
      active = false;
    };
  }, []);

  const uniqueLocations = useMemo(
    () =>
      Array.from(
        new Set([
          ...countryOptions,
          ...universities.map((u) => u.location),
          // Keep any country restored from the URL selectable even if the API
          // request has not resolved yet.
          ...locations,
        ])
      )
        .filter(Boolean)
        .sort(),
    [countryOptions, universities, locations]
  );


  // 7. Column Definitions for @tanstack/react-table
  const columns = useMemo<ColumnDef<typeof filteredData[0]>[]>(
    () => [
      {
        id: "calculatedRank",
        header: "Rank",
        accessorKey: "calculatedRank",
        cell: ({ row }) => (
          <span
            className={`aur-rank-badge aur-tabular ${
              row.original.calculatedRank <= 3 ? "aur-rank-badge--elite" : ""
            }`}
          >
            {row.original.calculatedRank}
          </span>
        ),
      },
      {
        id: "name",
        header: "University Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="text-left font-sans font-bold text-[var(--aur-text)] transition-all active:scale-95 cursor-pointer inline-block w-full truncate" onClick={() => onUniversitySelect(row.original.id)}>
            <div className="truncate w-full">{row.original.name}</div>
            <div className="flex min-w-0 items-center text-[10px] text-[var(--aur-text-muted)] font-mono font-medium uppercase mt-0.5">
              <Globe className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate">{row.original.location}</span>
            </div>
          </div>
        ),
      },
      {
        id: "calculatedScore",
        header: "Score",
        accessorKey: "calculatedScore",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          // A zero here means the record carries no indicator data at all, not
          // that the institution scored zero — show it as unrated instead.
          if (value <= 0) return <span className="aur-tabular text-slate-300">—</span>;
          return (
            <span className="aur-score-pill aur-tabular text-[var(--aur-text)]">
              {value.toFixed(1)}
            </span>
          );
        },
      },
      {
        id: "citations",
        header: "Citations",
        accessorKey: "citations",
        cell: ({ getValue }) => renderMetric(getValue() as number),
      },
      {
        id: "research",
        header: "Research",
        accessorKey: "research",
        cell: ({ getValue }) => renderMetric(getValue() as number),
      },
      {
        id: "employability",
        header: "Employability",
        accessorKey: "employability",
        cell: ({ getValue }) => renderMetric(getValue() as number),
      },
      {
        id: "tuition",
        header: "Tuition / Yr",
        accessorKey: "tuition",
        cell: ({ row }) => (
          <span className="inline-flex min-w-[5.5rem] justify-end font-mono text-xs text-[var(--aur-text-muted)] bg-[var(--aur-surface-2)] border border-[var(--aur-border)] px-1.5 py-0.5">
            {row.original.tuition}
          </span>
        ),
      },
      {
        id: "compare",
        header: "Compare",
        cell: ({ row }) => {
          const isSelected = selectedUniIds.includes(row.original.id);
          return (
            <button
              type="button"
              onClick={() => onToggleCompare(row.original.id)}
              aria-label={
                isSelected
                  ? `Remove ${row.original.name} from comparison`
                  : `Add ${row.original.name} to comparison`
              }
              aria-pressed={isSelected}
              className={`aur-btn-ghost aur-focus-ring ${focusRing} ${
                isSelected ? "aur-btn-ghost--active" : ""
              }`}
            >
              {isSelected ? (
                <>
                  <CheckSquare className="h-3.5 w-3.5 shrink-0 text-[var(--aur-text)]" />
                  <span className="hidden text-[10px] sm:inline">Added</span>
                </>
              ) : (
                <>
                  <Square className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden text-[10px] sm:inline">Compare</span>
                </>
              )}
            </button>
          );
        },
      },
    ],
    [selectedUniIds, onToggleCompare, onUniversitySelect]
  );

  // 8. TanStack Table Instance
  const table = useReactTable({
    data: previewData,
    columns,
    state: {
      sorting,
    },
    // Logged-out preview shows all PREVIEW_LIMIT rows on one page (no confusing
    // pagination); logged-in users get a standard page size.
    initialState: {
      pagination: { pageSize: PREVIEW_LIMIT, pageIndex: 0 },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleNextPage = async () => {
    if (table.getCanNextPage()) {
      table.nextPage();
      return;
    }
    // Under a country filter the whole result set is already in memory;
    // loadMore() would page the unfiltered dataset instead.
    if (isServerFiltered || !hasMore || loadingMore) return;

    const nextPageIndex = table.getState().pagination.pageIndex + 1;
    await loadMore();
    window.requestAnimationFrame(() => table.setPageIndex(nextPageIndex));
  };
  const canGoNext =
    table.getCanNextPage() || (isAuthenticated && hasMore && !isServerFiltered);
  const remainingCount = Math.max(totalCount - universities.length, 0);
  const totalLabel = totalCountKnown ? String(totalCount) : `${universities.length}+`;

  return (
    <div className="relative aur-rankings-shell mx-auto w-full max-w-[1600px] px-3 sm:px-5 lg:px-8 py-6 sm:py-8 font-sans flex-grow">
      
      {/* Ambient Liquid Glass Orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-full max-h-[600px] bg-gradient-to-b from-blue-400/10 via-cyan-300/5 to-transparent rounded-[100%] blur-[120px] pointer-events-none -z-10" />

      {/* Combined navy header + filter card */}
      <div className="aur-rankings-panel relative z-20 mb-6 sm:mb-8 rounded-3xl bg-[#1A365D] p-6 sm:p-8 shadow-(--aur-shadow-lg)">
        {/* Editorial Title */}
        <div className="mb-6 sm:mb-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Engine & Analytics Database</span>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight mt-2 text-white">
            Asia Institutional Ranking Table
          </h2>
          <p className="text-[11px] text-white/50 font-mono mt-3 tracking-wide">
            {dataError ? "Live index unavailable" : "Live index"} &middot;{" "}
            {isServerFiltered
              ? locations.length > 0
                ? `${filteredData.length} universities in ${locations.join(", ")}`
                : `${filteredData.length} universities matching "${trimmedSearch}"`
              : `${universities.length} of ${totalLabel} universities loaded`}
          </p>
        </div>

        {/* Divider between header and filters */}
        <div className="mb-6 h-px w-full bg-white/10" />

        {/* 9. Elite Filtering Bar Layout */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-start">
          <p className="w-full text-[10px] uppercase font-bold tracking-widest text-white/50 -mb-2">
            Refine index
          </p>

          {/* Search Field — takes the leftover width so Country sits beside it
              rather than being pushed to the far edge of the card. */}
          <div className="relative flex min-h-[5.75rem] w-full flex-col sm:flex-1 sm:min-w-[16rem]">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/60 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full h-11 rounded-xl bg-white border border-white/20 px-4 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition-all placeholder:text-slate-400"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          {/* Country Dropdown — kept narrow; country names are short, so a full
              grid column reads as an oversized empty field on wide screens. */}
          <div className="flex min-h-[5.75rem] w-full flex-col sm:w-60 sm:shrink-0">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/60 mb-2">
              Country
            </label>
            <div className="relative z-30">
              <MultiSelectDropdown
                options={uniqueLocations}
                selected={locations}
                onChange={(next) => {
                  setLocations(next);
                  serializeStateToUrl(searchQuery, next, weights);
                }}
                placeholder="Filter Country..."
              />
            </div>
            {/* Active Country tags */}
            {locations.length > 0 && (
              <div className="min-h-6 flex flex-wrap gap-1 mt-1.5">
                {locations.map((loc) => (
                  <span
                    key={loc}
                    onClick={() => handleLocationToggle(loc)}
                    className="inline-flex max-w-full items-center rounded-full text-[10px] font-mono border border-white/20 bg-white/10 text-white/90 px-2 py-0.5 cursor-pointer hover:border-red-400 hover:text-red-300 transition-colors"
                  >
                    {loc} <X className="h-2.5 w-2.5 ml-1" />
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {dataError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Live rankings couldn&apos;t be loaded right now. Please try again later.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
        <span className="text-[10px] text-[var(--aur-text-muted)] font-bold uppercase tracking-wider">
          {isServerFiltered ? "Found: " : "Loaded: "}
          <span className="text-[var(--aur-text)] font-mono">{filteredData.length}</span> matching institutions
        </span>
        <button
          onClick={handleResetFilters}
          className="aur-rankings-reset inline-flex w-fit items-center text-[10px] font-bold uppercase tracking-wider transition-colors"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset All Filters
        </button>
      </div>

      {/* 10. Advanced Motion Grid List */}
      <div className="relative z-10 w-full mb-4">
        {/* Header Grid */}
        <div className="hidden sm:grid grid-cols-[3rem_minmax(180px,2fr)_minmax(60px,1fr)_minmax(60px,1fr)_minmax(60px,1fr)_minmax(60px,1fr)_minmax(80px,1fr)_7rem] gap-3 px-6 pb-3 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase items-center">
          {table.getHeaderGroups().map((headerGroup) => 
            headerGroup.headers.map((header, idx) => {
              const columnId = header.column.id;
              const isMobileHiddenCol = ["citations", "research", "employability", "tuition"].includes(columnId);
              const alignRight = ["calculatedScore", "citations", "research", "employability", "tuition"].includes(columnId);
              
              return (
                <div 
                  key={header.id} 
                  className={`${isMobileHiddenCol ? "hidden sm:block" : ""} ${alignRight ? "text-right" : ""} ${header.column.getCanSort() ? "cursor-pointer hover:text-slate-600 transition-colors" : ""}`}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className={`flex items-center space-x-1 ${alignRight ? "justify-end" : ""}`}>
                    <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                    {header.column.getCanSort() && (
                      <span className="shrink-0 text-slate-300">
                        {header.column.getIsSorted() === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : null}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* List Items */}
        <div className="flex flex-col gap-3">
          {table.getRowModel().rows.map((row) => (
            <div
              key={row.id}
              className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/80 transition-colors duration-150 hover:border-aur-primary/25 hover:bg-white"
            >
              <div className="relative z-10 grid grid-cols-[2.25rem_minmax(0,1fr)_3rem_2.75rem] sm:grid-cols-[3rem_minmax(180px,2fr)_minmax(60px,1fr)_minmax(60px,1fr)_minmax(60px,1fr)_minmax(60px,1fr)_minmax(80px,1fr)_7rem] gap-2 sm:gap-3 items-center px-3 sm:px-6 py-3.5">
                {row.getVisibleCells().map((cell) => {
                  const columnId = cell.column.id;
                  const isMobileHiddenCol = ["citations", "research", "employability", "tuition"].includes(columnId);
                  const alignRight = ["calculatedScore", "citations", "research", "employability", "tuition"].includes(columnId);

                  return (
                    <div
                      key={cell.id}
                      className={`min-w-0 ${isMobileHiddenCol ? "hidden sm:block" : ""} ${alignRight ? "text-right" : ""}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Country results are fetched, so the table is briefly empty while the
              request is in flight — showing "no match" there would be wrong. */}
          {countryLoading && filteredData.length === 0 && (
            <div className="py-16 px-6 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl text-center text-sm text-slate-500">
              Loading institutions…
            </div>
          )}

          {!countryLoading && filteredData.length === 0 && (
            <div className="py-16 px-6 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center border border-white bg-white/50 rounded-xl mb-4 shadow-sm">
                <FilterX className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-800 mb-2">
                No institutions match your filters
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 max-w-sm">
                Try a different country or search term—or reset all filters to browse the full index.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="bg-[#1A365D] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors shadow-md"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Locked preview CTA — logged-out visitors capped at PREVIEW_LIMIT */}
      {isPreviewCapped && (
        <div className="relative mt-2 overflow-hidden rounded-2xl border border-[#1A365D]/15 bg-gradient-to-b from-white/60 to-[#1A365D]/[0.06] px-6 py-10 text-center">
          {/* Faded teaser rows behind the CTA */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-6 flex flex-col gap-2 px-6 opacity-40 blur-[2px]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-white/70 border border-white/80" style={{ opacity: 1 - i * 0.3 }} />
            ))}
          </div>
          <div className="relative">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A365D]/10 text-[#1A365D]">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1A365D]">
              {totalCountKnown ? `${remainingCount} more institutions` : "More institutions available"}
            </h3>
            <p className="mx-auto mt-2 mb-6 max-w-sm text-sm leading-relaxed text-slate-500">
              You&apos;re viewing the top {universities.length} of {totalLabel}. Create a free account to load more rankings, compare institutions, and save your shortlist.
            </p>
            <button
              type="button"
              onClick={() => promptSignIn("Sign in to see the full institution ranking.")}
              className="rounded-lg bg-[#1A365D] px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-900"
            >
              {totalCountKnown ? `Unlock all ${totalCount} universities` : "Unlock full ranking"}
            </button>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div className={`aur-panel aur-rankings-pagination flex items-center justify-between px-3 sm:px-4 py-3 mt-4 rounded-sm ${isPreviewCapped ? "hidden" : ""}`}>
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={`relative inline-flex items-center border border-[var(--aur-border)] bg-[var(--aur-surface-2)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--aur-text)] hover:bg-[var(--aur-surface-hover)] disabled:opacity-50 rounded-lg ${focusRing}`}
          >
            Previous
          </button>
          <button
            onClick={() => void handleNextPage()}
            disabled={!canGoNext || loadingMore}
            className={`relative ml-3 inline-flex items-center border border-[var(--aur-border)] bg-[var(--aur-surface-2)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--aur-text)] hover:bg-[var(--aur-surface-hover)] disabled:opacity-50 rounded-lg ${focusRing}`}
          >
            {loadingMore ? "Loading…" : "Next"}
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] text-[var(--aur-text-muted)] font-bold uppercase tracking-widest">
              {isServerFiltered ? (
                // The full server-side result is already in memory, so the page
                // count is exact — "of N loaded" would describe the unfiltered
                // provider rather than what the table is showing.
                <>
                  Page{" "}
                  <span className="font-mono text-[var(--aur-text)]">
                    {table.getState().pagination.pageIndex + 1}
                  </span>{" "}
                  of{" "}
                  <span className="font-mono text-[var(--aur-text)]">
                    {table.getPageCount() || 1}
                  </span>{" "}
                  &middot;{" "}
                  <span className="font-mono text-[var(--aur-text)]">{filteredData.length}</span>{" "}
                  {filteredData.length === 1 ? "result" : "results"}
                  {locations.length > 0 ? ` in ${locations.join(", ")}` : ""}
                </>
              ) : (
                <>
                  Showing page{" "}
                  <span className="font-mono text-[var(--aur-text)]">
                    {table.getState().pagination.pageIndex + 1}
                  </span>{" "}
                  &middot; <span className="font-mono text-[var(--aur-text)]">{universities.length}</span> of{" "}
                  <span className="font-mono text-[var(--aur-text)]">{totalLabel}</span> loaded
                </>
              )}
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className={`relative inline-flex items-center border border-[var(--aur-border)] bg-[var(--aur-surface)] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--aur-text-secondary)] hover:bg-[var(--aur-surface-hover)] disabled:opacity-50 rounded-l-md transition-colors ${focusRing}`}
              >
                Previous
              </button>
              <button
                onClick={() => void handleNextPage()}
                disabled={!canGoNext || loadingMore}
                className={`relative inline-flex items-center border border-l-0 border-[var(--aur-border)] bg-[var(--aur-surface)] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--aur-text-secondary)] hover:bg-[var(--aur-surface-hover)] disabled:opacity-50 rounded-r-md transition-colors ${focusRing}`}
              >
                {loadingMore ? "Loading…" : "Next"}
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* 11. Custom Recalculation Weights Slide-Out Drawer */}
      {isWeightsDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div className="absolute inset-0 bg-cyber-black/60 backdrop-blur-xs transition-opacity" onClick={() => setIsWeightsDrawerOpen(false)} />
          <div className="fixed inset-y-0 right-0 p-0 sm:pl-10 max-w-full flex">
            <div className="w-full max-w-md bg-[var(--aur-surface)] border-l border-[var(--aur-border)] flex flex-col justify-between shadow-2xl">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-[var(--aur-border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--aur-text-muted)]">
                      Calculations Lab
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[var(--aur-text)] mt-0.5">
                      Recalculate Rank Weights
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsWeightsDrawerOpen(false)}
                    className="p-1 hover:bg-[var(--aur-hover)] rounded-lg text-[var(--aur-text-muted)] hover:text-[var(--aur-text)]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-[var(--aur-text-secondary)] text-xs mt-3 leading-relaxed">
                  Modify the relative priority weights below. The system automatically recalculates total scores using instant frontend arithmetic.
                </p>
              </div>

              {/* Drawer Sliders list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {[
                  { key: "citations", label: "Citations Impact", desc: "Scientific citation frequency per paper" },
                  { key: "research", label: "Research Metric", desc: "Academic staff peer assessment" },
                  { key: "employability", label: "Employability Ratio", desc: "Alumni professional career placement" },
                  { key: "teaching", label: "Teaching Staff", desc: "Faculty-to-student metrics ratio" },
                ].map((slider) => {
                  const currentValue = weights[slider.key as keyof typeof weights];
                  return (
                    <div key={slider.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-[var(--aur-text)] block">{slider.label}</label>
                          <span className="text-[10px] text-[var(--aur-text-muted)] block">{slider.desc}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-[var(--aur-text)] bg-[var(--aur-surface-2)] px-2 py-0.5 border border-[var(--aur-border-strong)] rounded-md">
                          {currentValue}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={currentValue}
                        onChange={(e) => handleWeightChange(slider.key as any, parseInt(e.target.value))}
                        className="w-full cursor-pointer"
                        style={{ accentColor: "var(--aur-text)" }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Drawer Footer controls */}
              <div className="p-6 border-t border-[var(--aur-border)] bg-[var(--aur-surface-2)] flex items-center justify-between">
                <button
                  onClick={() => {
                    setWeights(DEFAULT_WEIGHTS);
                    serializeStateToUrl(searchQuery, locations, DEFAULT_WEIGHTS);
                  }}
                  className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[var(--aur-text-muted)] hover:text-[var(--aur-text)] transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Default Weights
                </button>
                <button
                  onClick={() => setIsWeightsDrawerOpen(false)}
                  className="aur-btn-primary px-6 py-2.5"
                >
                  Apply Recalculation
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

