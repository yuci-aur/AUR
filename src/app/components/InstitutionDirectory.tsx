/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import type { University } from "../types";
import {
  searchUniversities,
  UNIVERSITY_PAGE_SIZE,
} from "../lib/universities";
import { useSidebar } from "./navigation/SidebarContext";
import { useUniversityData } from "./data/UniversityDataProvider";
import { useAuthGate } from "./auth/AuthGate";
import { PREVIEW_LIMIT } from "./navigation/config";

const COUNTRY_FLAGS: Record<string, string> = {
  China: "", Japan: "", "South Korea": "", Singapore: "",
  "Hong Kong": "", India: "", Taiwan: "", Malaysia: "",
  Thailand: "", Indonesia: "", Uzbekistan: "",
};

interface Props { onUniversitySelect: (id: string) => void; }

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) return [1, 2, 3, 4, 5, "end-gap", totalPages];
  if (currentPage >= totalPages - 3) {
    return [1, "start-gap", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "start-gap", currentPage - 1, currentPage, currentPage + 1, "end-gap", totalPages];
}

function UniversityCard({ uni, rank, onClick }: { uni: University; rank: number | null; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View ${uni.name}`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white text-left shadow-[0_8px_30px_rgba(15,35,64,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#1A365D]/30 hover:shadow-[0_18px_45px_rgba(15,35,64,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A365D] focus-visible:ring-offset-2"
    >
      <div className="relative h-36 w-full shrink-0 overflow-hidden bg-[#e8eef5]">
        {uni.campusPhoto && (
          <img
            src={uni.campusPhoto}
            alt={`${uni.name} campus`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#102a4c]/55 via-transparent to-[#102a4c]/10" />

        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-[#132f55]/95 px-2.5 py-1.5 text-white shadow-sm backdrop-blur-sm">
          <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/60">AUR</span>
          <span className="font-mono text-xs font-bold">
            {rank ? `#${rank}` : "Unranked"}
          </span>
        </div>

        {uni.hasMedicine && (
          <div className="absolute right-3 top-3 rounded-md border border-white/25 bg-white/90 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-rose-700 shadow-sm backdrop-blur-sm">
            Medicine
          </div>
        )}

        {uni.logo && (
          <div className="absolute bottom-3 left-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white p-1 shadow-lg">
            <img
              src={uni.logo}
              alt=""
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div>
          <h3 className="line-clamp-2 min-h-[2.75rem] font-serif text-[18px] font-bold leading-snug text-[#132f55] transition-colors group-hover:text-[#0b2445]">
            {uni.name}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-medium">
              <MapPin className="h-3.5 w-3.5 text-[#52709a]" />
              {uni.location}
            </span>
            {typeof uni.isPublic === "boolean" && (
              <>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{uni.isPublic ? "Public" : "Private"}</span>
              </>
            )}
          </div>
        </div>

        {uni.subjects.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {uni.subjects.slice(0, 2).map((s) => (
              <span key={s} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                {s}
              </span>
            ))}
            {uni.hasMedicine && !uni.subjects.slice(0, 2).includes("Medicine") && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">Medicine</span>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 divide-x divide-slate-200 border-y border-slate-200 py-3 [&>*:first-child]:pl-0 [&>*:last-child]:pr-0">
          <Metric label="Academic" value={uni.academicReputation ?? uni.research} />
          <Metric label="Careers" value={uni.employerReputation ?? uni.employability} />
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-slate-200 pt-4">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Overall score</div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="font-mono text-[24px] font-extrabold leading-none text-[#132f55]">{uni.overall.toFixed(1)}</span>
              <span className="text-[11px] font-bold text-slate-400">/100</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#132f55] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white transition-colors group-hover:bg-[#0b2445]">
            Profile <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </button>
  );
}

function Metric({ label, value }: { label: string; value?: number }) {
  const v = typeof value === "number" ? Math.round(value) : null;
  return (
    <div className="px-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
        <span className="flex items-baseline gap-0.5 font-mono text-lg font-extrabold leading-none text-[#132f55]">
          {v ?? "—"}
          {v !== null && <span className="text-[8px] font-semibold text-slate-400">/100</span>}
        </span>
      </div>
      <div className="mt-2.5 h-0.5 overflow-hidden bg-slate-200">
        <div
          className="h-full bg-[#d5a021] transition-[width] duration-500"
          style={{ width: `${Math.max(0, Math.min(100, v ?? 0))}%` }}
        />
      </div>
    </div>
  );
}

export default function InstitutionDirectory({ onUniversitySelect }: Props) {
  const {
    universities,
    totalCount,
    totalCountKnown,
    loading,
    hasMore,
    error,
  } = useUniversityData();
  const { isAuthenticated, promptSignIn } = useAuthGate();
  const { searchQuery: search, setSearchQuery: setSearch } = useSidebar();
  const [country, setCountry] = useState("All");
  const [medOnly, setMedOnly] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [results, setResults] = useState<University[] | null>(null);
  const [resultTotal, setResultTotal] = useState<number | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // The country filter must offer every country in the dataset, not just those
  // appearing in the page currently loaded.
  const [countries, setCountries] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/data/misc?resource=university-countries")
      .then((response) => {
        if (!response.ok) throw new Error("Countries unavailable.");
        return response.json() as Promise<string[]>;
      })
      .then((list) => {
        if (active) setCountries(list);
      })
      .catch(() => {
        // Non-fatal: fall back to countries seen in the loaded results.
      });
    return () => {
      active = false;
    };
  }, []);

  const ALL_COUNTRIES = useMemo(() => {
    const fromResults = (results ?? universities).map((u) => u.location);
    return ["All", ...Array.from(new Set([...countries, ...fromResults])).sort()];
  }, [countries, results, universities]);

  // Any filter change returns to the first page; keeping the old page index
  // would request an offset past the end of the new, smaller result set.
  useEffect(() => {
    setPageIndex(0);
  }, [search, country, medOnly]);

  // Search runs against the database so it covers all institutions, not the 20
  // rows held in memory. Debounced so each keystroke does not issue a query.
  useEffect(() => {
    let active = true;
    const filters = { search, country, medicineOnly: medOnly };
    const isDefaultView = !search.trim() && country === "All" && !medOnly && pageIndex === 0;

    if (isDefaultView) {
      setResults(null);
      setResultTotal(null);
      setPageError(null);
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    const timer = setTimeout(() => {
      searchUniversities(filters, pageIndex * UNIVERSITY_PAGE_SIZE, UNIVERSITY_PAGE_SIZE)
        .then((page) => {
          if (!active) return;
          setResults(page.universities);
          setResultTotal(page.total);
          setPageError(null);
        })
        .catch(() => {
          if (!active) return;
          setResults([]);
          setResultTotal(0);
          setPageError("Those results could not be loaded. Please try again.");
        })
        .finally(() => {
          if (active) setPageLoading(false);
        });
    }, search.trim() ? 300 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, country, medOnly, pageIndex]);

  const goToPage = (nextPageIndex: number) => {
    if (pageLoading || nextPageIndex === pageIndex || nextPageIndex < 0) return;
    setPageIndex(nextPageIndex);
    document
      .getElementById("institution-directory-results")
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const filtered = results ?? universities;
  // Total across the whole dataset for the active filters — the server reports
  // it, so it is not capped by the page size.
  const matchTotal = resultTotal ?? totalCount;
  const isFiltering = Boolean(search.trim()) || country !== "All" || medOnly;
  const isPreviewCapped =
    !isAuthenticated && (hasMore || totalCount > filtered.length);
  const visible = isPreviewCapped ? filtered.slice(0, PREVIEW_LIMIT) : filtered;
  const remainingCount = Math.max(matchTotal - visible.length, 0);
  const totalLabel = totalCountKnown ? String(totalCount) : `${universities.length}+`;
  const totalPages = Math.max(1, Math.ceil(matchTotal / UNIVERSITY_PAGE_SIZE));
  const paginationItems = getPaginationItems(pageIndex + 1, totalPages);
  const pageStart = matchTotal === 0 ? 0 : pageIndex * UNIVERSITY_PAGE_SIZE + 1;
  const pageEnd = Math.min(pageStart + filtered.length - 1, matchTotal);

  return (
    <div className="w-full min-h-screen bg-[var(--background)] pb-12">
      {/* ── HERO BAND (navy) ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--aur-navy)] to-[var(--aur-navy-2)] px-4 md:px-8 pt-7 pb-8 mx-3 md:mx-6 mt-4 rounded-2xl shadow-[var(--aur-shadow)]">
        {/* subtle decorative glow */}
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/[0.04] blur-2xl" />
        <div className="relative max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div className="border-l-[3px] border-[var(--aur-accent-muted)] pl-4">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-white">Institution Directory</h1>
              <p className="text-[12px] text-white/60 mt-1">{totalLabel} universities across Asia</p>
            </div>
            <span className="text-[11px] text-white font-bold bg-white/10 border border-white/15 px-3 py-1.5 rounded-lg self-start md:self-auto backdrop-blur-sm">
              {matchTotal} {isFiltering ? "match" : "result"}
              {matchTotal !== 1 ? (isFiltering ? "es" : "s") : ""}
            </span>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or country…"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white border border-transparent text-[13px] text-[var(--aur-text)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--aur-accent)]/40 shadow-sm transition"
              />
            </div>

            {/* Country */}
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="text-[12px] font-semibold text-[var(--aur-text)] bg-white border border-transparent rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--aur-accent)]/40 shadow-sm cursor-pointer"
            >
              {ALL_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Countries" : `${c}`}
                </option>
              ))}
            </select>

            {/* Med toggle */}
            <button
              onClick={() => setMedOnly((v) => !v)}
              className={`text-[11px] font-bold px-3.5 py-2.5 rounded-lg border transition-all ${
                medOnly
                  ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                  : "bg-white/10 text-white/80 border-white/15 hover:bg-white/20 hover:text-white backdrop-blur-sm"
              }`}
            >
              Medicine Only
            </button>
          </div>
        </div>
      </div>

      {/* ── CARD GRID ── */}
      <div id="institution-directory-results" className="max-w-[1600px] mx-auto scroll-mt-20 px-4 md:px-8 py-8">
        {error && !loading && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Live rankings couldn&apos;t be loaded right now. Please try again later.
          </div>
        )}
        {pageError && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {pageError}
          </div>
        )}
        {loading || (pageLoading && filtered.length === 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-[var(--aur-surface)] border border-[var(--aur-border)] rounded-[20px] overflow-hidden animate-pulse"
              >
                <div className="h-44 w-full bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-3/4 bg-slate-100 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-100 max-w-lg mx-auto mt-6">
            <MapPin className="h-8 w-8 text-amber-250 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No universities found matching your filters.</p>
            <button
              onClick={() => { setSearch(""); setCountry("All"); setMedOnly(false); }}
              className="mt-3 text-amber-500 text-[12px] font-bold hover:text-amber-600 underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div
              aria-busy={pageLoading}
              className={`grid grid-cols-1 gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                pageLoading ? "pointer-events-none opacity-45" : "opacity-100"
              }`}
            >
              {visible.map((uni) => (
                <UniversityCard
                  key={uni.id}
                  uni={uni}
                  rank={uni.history[0] ?? null}
                  onClick={() => onUniversitySelect(uni.id)}
                />
              ))}
            </div>

            {isAuthenticated && totalPages > 1 && (
              <div className="mt-10 border-t border-slate-200 pt-6">
                <div className="mb-4 flex items-center justify-between sm:mb-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Showing <span className="text-[#1A365D]">{pageStart}–{pageEnd}</span> of{" "}
                    <span className="text-[#1A365D]">{matchTotal}</span>
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:hidden">
                    Page {pageIndex + 1} / {totalPages}
                  </p>
                </div>

                <nav
                  aria-label="Institution directory pagination"
                  className="flex items-center justify-between gap-3 sm:-mt-6 sm:justify-end"
                >
                  <button
                    type="button"
                    onClick={() => void goToPage(pageIndex - 1)}
                    disabled={pageIndex === 0 || pageLoading}
                    aria-label="Previous page"
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#1A365D] shadow-sm transition hover:border-[#1A365D]/30 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5a021] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="hidden items-center gap-1 sm:flex">
                    {paginationItems.map((item) =>
                      typeof item === "string" ? (
                        <span
                          key={item}
                          aria-hidden="true"
                          className="flex h-10 w-8 items-center justify-center text-sm font-bold text-slate-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => void goToPage(item - 1)}
                          disabled={pageLoading}
                          aria-current={item === pageIndex + 1 ? "page" : undefined}
                          aria-label={`Page ${item}`}
                          className={`relative h-10 min-w-10 rounded-lg px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5a021] ${
                            item === pageIndex + 1
                              ? "bg-[#1A365D] text-white shadow-[0_7px_18px_rgba(26,54,93,0.22)] after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-[#f3b90b]"
                              : "border border-transparent bg-white text-slate-600 hover:border-slate-200 hover:text-[#1A365D]"
                          }`}
                        >
                          {item}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void goToPage(pageIndex + 1)}
                    disabled={pageIndex >= totalPages - 1 || pageLoading}
                    aria-label="Next page"
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#1A365D] shadow-sm transition hover:border-[#1A365D]/30 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5a021] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              </div>
            )}

            {isPreviewCapped && (
              <div className="relative mt-8 overflow-hidden rounded-2xl border border-[#1A365D]/15 bg-gradient-to-b from-white to-[#1A365D]/[0.06] px-6 py-10 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A365D]/10 text-[#1A365D]">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1A365D]">
                  {remainingCount > 0
                    ? `${remainingCount} more ${isFiltering ? "matches" : "institutions"}`
                    : "More institutions available"}
                </h3>
                <p className="mx-auto mt-2 mb-6 max-w-sm text-sm leading-relaxed text-slate-500">
                  {isFiltering
                    ? `You're viewing ${visible.length} of ${matchTotal} matching institutions.`
                    : `You're viewing ${visible.length} of ${totalLabel}.`}{" "}
                  Create a free account to explore more of the directory, compare institutions, and save your shortlist.
                </p>
                <button
                  type="button"
                  onClick={() => promptSignIn("Sign in to browse the full institution directory.")}
                  className="rounded-lg bg-[#1A365D] px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-900"
                >
                  {totalCountKnown ? `Unlock all ${totalCount} institutions` : "Unlock full directory"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
