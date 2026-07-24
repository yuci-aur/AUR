"use client";

import React from "react";
import InsightsGrid from "./insights/InsightsGrid";

/**
 * In-app Insights feed. Renders inside the main app shell (navbar + layout stay put),
 * matching how Rankings, Analytics, and News tabs behave — no standalone page header.
 */
export default function InsightsFeed() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="mb-8 border-b border-[var(--aur-border)] pb-5">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Insights</span>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--aur-text)] sm:text-4xl">
          Insights &amp; Analysis
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--aur-text-secondary)]">
          Research, rankings, and practical perspectives on the forces shaping Asian higher education.
        </p>
      </div>
      <InsightsGrid />
    </div>
  );
}
