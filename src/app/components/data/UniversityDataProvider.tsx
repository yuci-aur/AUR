"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { University } from "../../data";
import { MOCK_UNIVERSITIES } from "../../data";
import { fetchUniversities } from "../../lib/universities";

interface UniversityDataContextValue {
  universities: University[];
  loading: boolean;
  /** Set when the live API could not be reached; `universities` then holds sample data. */
  error: string | null;
  refresh: () => void;
}

const UniversityDataContext = createContext<UniversityDataContextValue | null>(null);

export function UniversityDataProvider({ children }: { children: React.ReactNode }) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError(null);

    fetchUniversities()
      .then((data) => {
        if (!isMounted) return;
        setUniversities(data);
        setError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setUniversities(MOCK_UNIVERSITIES);
        setError("Live rankings are unavailable right now — showing sample data.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  const value = useMemo(
    () => ({
      universities,
      loading,
      error,
      refresh,
    }),
    [universities, loading, error, refresh]
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
