"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { University } from "../../types";
import {
  clearUniversityQueryCache,
  fetchUniversityPage,
  type UniversityCursor,
} from "../../lib/universities";

interface UniversityDataContextValue {
  universities: University[];
  /** Institutions in the whole dataset — not just the pages loaded so far. */
  totalCount: number;
  totalCountKnown: boolean;
  /**
   * Distinct countries across the whole dataset. Cannot be derived from
   * `universities`, which only holds the pages fetched so far.
   */
  totalCountries: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  /** Set when the live API could not be reached. */
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => void;
}

const UniversityDataContext = createContext<UniversityDataContextValue | null>(null);

export function UniversityDataProvider({ children }: { children: React.ReactNode }) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalCountKnown, setTotalCountKnown] = useState(false);
  const [totalCountries, setTotalCountries] = useState(0);
  const [cursor, setCursor] = useState<UniversityCursor | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError(null);

    fetchUniversityPage()
      .then((page) => {
        if (!isMounted) return;
        setUniversities(page.universities);
        setTotalCount(page.total);
        setTotalCountKnown(true);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
        setError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setUniversities([]);
        setTotalCount(0);
        setTotalCountKnown(false);
        setCursor(null);
        setHasMore(false);
        setError("Live rankings are unavailable right now. Please try again.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  // Dataset-wide totals, fetched separately from the paginated list so
  // headline figures reflect the full dataset rather than the first page.
  useEffect(() => {
    let isMounted = true;

    fetch("/api/data/misc?resource=university-stats")
      .then((response) => {
        if (!response.ok) throw new Error("Stats unavailable.");
        return response.json() as Promise<{ total: number; countries: number }>;
      })
      .then((stats) => {
        if (!isMounted) return;
        setTotalCountries(stats.countries);
        if (stats.total > 0) {
          setTotalCount(stats.total);
          setTotalCountKnown(true);
        }
      })
      .catch(() => {
        // Non-fatal: consumers fall back to the paginated counts.
      });

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const loadMore = useCallback(async () => {
    if (!cursor || !hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const page = await fetchUniversityPage(
        cursor,
        undefined,
        universities.length
      );
      const existingIds = new Set(universities.map((university) => university.id));
      const additions = page.universities.filter(
        (university) => !existingIds.has(university.id)
      );
      const next = [...universities, ...additions];
      setUniversities(next);
      if (!totalCountKnown) setTotalCount(next.length);
      setHasMore(
        page.hasMore && (!totalCountKnown || next.length < totalCount)
      );
      setCursor(page.cursor);
      setError(null);
    } catch {
      setError("More rankings could not be loaded. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loadingMore, totalCount, totalCountKnown, universities]);

  const refresh = useCallback(() => {
    clearUniversityQueryCache();
    setReloadKey((key) => key + 1);
  }, []);

  const value = useMemo(
    () => ({
      universities,
      totalCount,
      totalCountKnown,
      totalCountries,
      loading,
      loadingMore,
      hasMore,
      error,
      loadMore,
      refresh,
    }),
    [
      universities,
      totalCount,
      totalCountKnown,
      totalCountries,
      loading,
      loadingMore,
      hasMore,
      error,
      loadMore,
      refresh,
    ]
  );

  return (
    <UniversityDataContext.Provider value={value}>
      {children}
    </UniversityDataContext.Provider>
  );
}

export function useUniversityData() {
  const context = useContext(UniversityDataContext);
  if (!context) {
    throw new Error("useUniversityData must be used within UniversityDataProvider");
  }
  return context;
}
