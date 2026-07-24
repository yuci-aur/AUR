"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewsFeed from "../components/NewsFeed";

/**
 * Standalone /news route — kept for direct links / SEO. It reuses the shared
 * NewsFeed so the content stays in sync with the in-app News tab, wrapped in a
 * lightweight header (this route renders outside the main app shell).
 */
export default function NewsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--aur-text)] font-sans pb-24">
      <header className="sticky top-0 z-50 bg-[var(--background)]/70 backdrop-blur-xl border-b border-[var(--aur-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-semibold text-[var(--aur-text-muted)] hover:text-[var(--aur-text)] transition-colors"
          >
            <div className="p-1.5 rounded-full bg-[var(--aur-surface-2)] group-hover:bg-[var(--aur-text)] group-hover:text-[var(--background)] transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            Back to Dashboard
          </Link>
          <div className="font-extrabold tracking-widest uppercase text-[10px] text-[var(--aur-text-muted)]">
            AUR Intelligence
          </div>
        </div>
      </header>

      <NewsFeed />
    </div>
  );
}