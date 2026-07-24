"use client";

/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Clock, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useExternalNewsData } from "../hooks/useExternalNewsData";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 15 } },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * In-app News feed. Renders inside the main app shell (navbar + layout stay put),
 * matching how Rankings, Analytics, and other tabs behave — no standalone page header.
 */
export default function NewsFeed() {
  const { externalNews, loading, error } = useExternalNewsData();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-12 border-b border-[var(--aur-border)] pb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--aur-surface-2)] text-[var(--aur-text-secondary)] rounded-full text-[11px] font-bold uppercase tracking-widest mb-6">
          <Zap className="h-3 w-3" /> Latest Updates
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-[1.1] text-[var(--aur-text)]">
          Asia Higher Education News
        </h1>
        <p className="text-[var(--aur-text-secondary)] text-base md:text-lg max-w-2xl leading-relaxed">
          Real-time coverage of Asian universities, rankings, scholarships, and policy — pulled live from across the web.
        </p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[var(--aur-surface)] rounded-3xl p-6 border border-[var(--aur-border)] h-[420px] flex flex-col">
              <div className="w-full h-48 bg-[var(--aur-surface-2)] rounded-2xl mb-6"></div>
              <div className="h-4 w-24 bg-[var(--aur-surface-2)] rounded mb-4"></div>
              <div className="h-6 w-full bg-[var(--aur-surface-2)] rounded mb-3"></div>
              <div className="h-6 w-3/4 bg-[var(--aur-surface-2)] rounded mb-6"></div>
              <div className="space-y-2 mt-auto">
                <div className="h-3 w-full bg-[var(--aur-surface-2)] rounded"></div>
                <div className="h-3 w-4/5 bg-[var(--aur-surface-2)] rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error || externalNews.length === 0 ? (
        <div className="text-sm text-[var(--aur-text-muted)] py-16 text-center border border-dashed border-[var(--aur-border)] rounded-2xl">
          No news available right now. Check back soon.
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {externalNews.map((item, idx) => (
            <motion.a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              variants={itemVariants}
              className="group relative flex flex-col bg-[var(--aur-surface)] rounded-3xl p-6 transition-all duration-500 hover:shadow-xl border border-[var(--aur-border)] hover:border-[var(--aur-border-strong)]"
            >
              {/* Image Thumbnail */}
              <div className="w-full h-48 rounded-2xl shrink-0 overflow-hidden relative shadow-sm border border-[var(--aur-border)] bg-[var(--aur-surface-2)] mb-6">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[var(--aur-surface-2)]">
                    <Zap className="h-12 w-12 text-[var(--aur-text-muted)]" />
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-1 relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  {item.source && (
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-sm bg-[var(--aur-surface-2)] text-[var(--aur-text-secondary)]">
                      {item.source}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-[var(--aur-text-muted)] font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <time>{formatDate(item.published_at)}</time>
                  </div>
                </div>

                <h2 className="text-xl font-bold mb-3 leading-snug transition-colors text-[var(--aur-text)] group-hover:opacity-80">
                  {item.title}
                </h2>

                {item.description && (
                  <p className="text-sm leading-relaxed mb-6 flex-1 text-[var(--aur-text-secondary)]">
                    {item.description}
                  </p>
                )}
              </div>
            </motion.a>
          ))}
        </motion.div>
      )}
    </div>
  );
}
