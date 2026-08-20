"use client";

import React from "react";
import BlogGrid from "./blog/BlogGrid";

/**
 * In-app Blog feed. Renders inside the main app shell (navbar + layout stay put),
 * matching how Rankings and News tabs behave — no standalone page header.
 */
export default function BlogFeed() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 font-sans sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-slate-200 pb-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Blog</span>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Perspectives on Asian higher education
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Research, rankings, and practical perspectives on the forces shaping Asian higher education.
        </p>
      </header>
      <BlogGrid />
    </div>
  );
}
