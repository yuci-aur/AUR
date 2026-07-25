"use client";

import React from "react";
import BlogGrid from "./blog/BlogGrid";

/**
 * In-app Blog feed. Renders inside the main app shell (navbar + layout stay put),
 * matching how Rankings, Analytics, and News tabs behave — no standalone page header.
 */
export default function BlogFeed() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-5 lg:px-8 py-6 sm:py-8 font-sans flex-grow">
      <div className="aur-rankings-hero mb-6 sm:mb-8 aur-hero-accent flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6">
        <div className="min-w-0">
          <span className="aur-caption">Editorial & Perspectives</span>
          <h2 className="aur-section-title text-3xl md:text-4xl leading-tight mt-2">
            Blog
          </h2>
          <p className="text-[11px] text-[var(--aur-text-muted)] font-mono mt-3 tracking-wide">
            Research, rankings, and practical perspectives on the forces shaping Asian higher education.
          </p>
        </div>
      </div>
      <BlogGrid />
    </div>
  );
}
