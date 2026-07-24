"use client";

import React, { useMemo, useRef, useState } from "react";
import { X, Search, Plus, ArrowUpRight } from "lucide-react";
import { University } from "../data";
import { useUniversityData } from "./data/UniversityDataProvider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MAX_SELECTION = 5;
const MAX_SUGGESTIONS = 8;

/* ------------------------------------------------------------------ */
/* Metric row definitions — score rows use the mono + amber micro-bar  */
/* leaderboard vocabulary; fact rows render plain values.              */
/* ------------------------------------------------------------------ */

type ScoreMetric = {
  key: string;
  label: string;
  get: (u: University) => number | undefined;
};

const SCORE_METRICS: ScoreMetric[] = [
  { key: "overall", label: "Overall score", get: (u) => u.overall },
  { key: "academic", label: "Academic reputation", get: (u) => u.academicReputation },
  { key: "research", label: "Research", get: (u) => u.research },
  { key: "teaching", label: "Teaching", get: (u) => u.teaching },
  { key: "citations", label: "Citations", get: (u) => u.citations },
  { key: "employability", label: "Employability", get: (u) => u.employability },
  { key: "intl", label: "International students", get: (u) => u.intlStudents },
];

function parseTuition(tuition: string): number | null {
  const numeric = parseInt(tuition.replace(/[^0-9]/g, ""), 10);
  return Number.isNaN(numeric) ? null : numeric;
}

/* Mono number + thin amber micro-bar on a slate track. */
function ScoreCell({ value, isBest }: { value: number | undefined; isBest: boolean }) {
  if (value === undefined || Number.isNaN(value)) {
    return <span className="text-sm text-slate-400">—</span>;
  }
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className="min-w-[7rem]">
      <span
        className={cn(
          "font-mono text-sm tabular-nums",
          isBest ? "font-bold text-aur-primary" : "text-slate-700"
        )}
      >
        {value.toFixed(1)}
      </span>
      <div className="mt-1.5 h-1 w-full rounded-full bg-slate-100">
        <div
          className="h-1 rounded-full bg-amber-400"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function ComparisonMatrix() {
  const { universities } = useUniversityData();

  const [selectedUnis, setSelectedUnis] = useState<University[]>([]);
  const [query, setQuery] = useState("");
  const [maxTuition, setMaxTuition] = useState("");
  const [country, setCountry] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const atLimit = selectedUnis.length >= MAX_SELECTION;

  /* Typeahead: name/country match, refined by the optional tuition and
     country constraints, minus anything already selected. */
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const countryQ = country.trim().toLowerCase();
    const max = maxTuition ? parseInt(maxTuition, 10) : null;

    if (!q && !countryQ && max === null) return [];

    return universities
      .filter((u) => {
        if (selectedUnis.some((s) => s.id === u.id)) return false;

        const matchesQuery =
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.location.toLowerCase().includes(q);

        const matchesCountry =
          !countryQ || u.location.toLowerCase().includes(countryQ);

        let matchesTuition = true;
        if (max !== null && !Number.isNaN(max)) {
          const numeric = parseTuition(u.tuition);
          matchesTuition = numeric !== null && numeric <= max;
        }

        return matchesQuery && matchesCountry && matchesTuition;
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [universities, query, country, maxTuition, selectedUnis]);

  const addUniversity = (uni: University) => {
    if (atLimit) return;
    setSelectedUnis((prev) =>
      prev.some((u) => u.id === uni.id) ? prev : [...prev, uni]
    );
    setQuery("");
    searchRef.current?.focus();
  };

  const removeUniversity = (id: string) => {
    setSelectedUnis((prev) => prev.filter((u) => u.id !== id));
  };

  /* Best value per score row — only meaningful with 2+ columns. */
  const bestByMetric = useMemo(() => {
    const best: Record<string, number | undefined> = {};
    if (selectedUnis.length < 2) return best;
    for (const metric of SCORE_METRICS) {
      const values = selectedUnis
        .map((u) => metric.get(u))
        .filter((v): v is number => v !== undefined && !Number.isNaN(v));
      if (values.length >= 2) best[metric.key] = Math.max(...values);
    }
    return best;
  }, [selectedUnis]);

  const hasRefinements = maxTuition !== "" || country !== "";

  return (
    <div className="min-h-screen w-full bg-[var(--background)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            Compare
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-aur-primary">
            Comparison Matrix
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Pick up to {MAX_SELECTION} institutions and evaluate them side by side
            across ranking metrics and tuition.
          </p>
        </header>

        {/* Picker panel */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_11rem_11rem]">
            {/* Search + typeahead */}
            <div className="relative">
              <label
                htmlFor="comparison-search"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Add a university
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="comparison-search"
                  ref={searchRef}
                  type="text"
                  role="combobox"
                  aria-expanded={pickerOpen && suggestions.length > 0}
                  aria-controls="comparison-suggestions"
                  autoComplete="off"
                  value={query}
                  disabled={atLimit}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPickerOpen(true);
                  }}
                  onFocus={() => setPickerOpen(true)}
                  onBlur={() => setPickerOpen(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setPickerOpen(false);
                    if (e.key === "Enter" && suggestions.length > 0) {
                      e.preventDefault();
                      addUniversity(suggestions[0]);
                    }
                  }}
                  placeholder={
                    atLimit
                      ? `Limit reached — remove one to add another`
                      : "Search by name or country…"
                  }
                  className="h-10 rounded-md border-slate-300 bg-white pl-9 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-aur-primary focus-visible:ring-2 focus-visible:ring-aur-primary/30"
                />
              </div>

              {pickerOpen && !atLimit && query.trim() !== "" && (
                <ul
                  id="comparison-suggestions"
                  role="listbox"
                  className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                >
                  {suggestions.length > 0 ? (
                    suggestions.map((uni) => (
                      <li key={uni.id} role="option" aria-selected={false}>
                        <button
                          type="button"
                          /* onMouseDown so the click lands before the input blurs */
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addUniversity(uni);
                          }}
                          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-900">
                              {uni.name}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {uni.location} · {uni.tuition}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="font-mono text-xs tabular-nums text-slate-500">
                              {uni.overall.toFixed(1)}
                            </span>
                            <Plus className="h-4 w-4 text-slate-400" />
                          </span>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-3 text-sm text-slate-500">
                      No universities match
                      {hasRefinements ? " your search and refinements." : " your search."}
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Refinements — constrain the suggestion list */}
            <div>
              <label
                htmlFor="comparison-max-tuition"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Max tuition (USD/yr)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  $
                </span>
                <Input
                  id="comparison-max-tuition"
                  type="text"
                  inputMode="numeric"
                  value={maxTuition}
                  onChange={(e) => setMaxTuition(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 5000"
                  className="h-10 rounded-md border-slate-300 bg-white pl-7 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-aur-primary focus-visible:ring-2 focus-visible:ring-aur-primary/30"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="comparison-country"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Country
              </label>
              <Input
                id="comparison-country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. China"
                className="h-10 rounded-md border-slate-300 bg-white text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-aur-primary focus-visible:ring-2 focus-visible:ring-aur-primary/30"
              />
            </div>
          </div>

          {/* Selected chips */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Selected
              <span className="ml-1.5 font-mono tabular-nums text-slate-500">
                {selectedUnis.length}/{MAX_SELECTION}
              </span>
            </span>
            {selectedUnis.length === 0 ? (
              <span className="text-sm text-slate-400">
                None yet — search above to add your first.
              </span>
            ) : (
              selectedUnis.map((uni) => (
                <span
                  key={uni.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1.5 text-sm font-medium text-slate-700"
                >
                  {uni.name}
                  <button
                    type="button"
                    onClick={() => removeUniversity(uni.id)}
                    aria-label={`Remove ${uni.name} from comparison`}
                    className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>
        </section>

        {/* Matrix */}
        {selectedUnis.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Nothing to compare yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Use the search box above to add up to {MAX_SELECTION} universities.
              Each one becomes a column here, with its scores lined up row by row.
            </p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="sticky left-0 z-10 min-w-[9rem] bg-white px-5 py-4 align-bottom">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Metric
                      </span>
                    </th>
                    {selectedUnis.map((uni) => (
                      <th
                        key={uni.id}
                        className="min-w-[10rem] px-5 py-4 align-bottom font-normal"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="block text-sm font-bold leading-snug text-aur-primary">
                              {uni.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {uni.location}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUniversity(uni.id)}
                            aria-label={`Remove ${uni.name} from comparison`}
                            className="rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SCORE_METRICS.map((metric) => (
                    <tr key={metric.key}>
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-white px-5 py-4 text-sm font-medium text-slate-600"
                      >
                        {metric.label}
                      </th>
                      {selectedUnis.map((uni) => {
                        const value = metric.get(uni);
                        const isBest =
                          bestByMetric[metric.key] !== undefined &&
                          value === bestByMetric[metric.key];
                        return (
                          <td
                            key={uni.id}
                            className={cn("px-5 py-4", isBest && "bg-amber-50/60")}
                          >
                            <ScoreCell value={value} isBest={isBest} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Fact rows */}
                  <tr>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-white px-5 py-4 text-sm font-medium text-slate-600"
                    >
                      Tuition
                    </th>
                    {selectedUnis.map((uni) => (
                      <td key={uni.id} className="px-5 py-4">
                        <span className="font-mono text-sm tabular-nums text-slate-700">
                          {uni.tuition}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-white px-5 py-4 text-sm font-medium text-slate-600"
                    >
                      Founded
                    </th>
                    {selectedUnis.map((uni) => (
                      <td key={uni.id} className="px-5 py-4">
                        <span className="font-mono text-sm tabular-nums text-slate-700">
                          {uni.founded ?? "—"}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-white px-5 py-4 text-sm font-medium text-slate-600"
                    >
                      Website
                    </th>
                    {selectedUnis.map((uni) => (
                      <td key={uni.id} className="px-5 py-4">
                        {uni.website ? (
                          <a
                            href={uni.website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-aur-primary hover:underline"
                          >
                            Visit site
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            {selectedUnis.length === 1 && (
              <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
                Add a second university to see the best value in each row highlighted.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
