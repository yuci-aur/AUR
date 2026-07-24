"use client";

/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useExternalNewsData } from "../hooks/useExternalNewsData";
import type { ExternalNewsItem } from "../hooks/useExternalNewsData";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Source name + published date, in the shared meta grammar for feed cards. */
function ArticleMeta({ item }: { item: ExternalNewsItem }) {
  const date = formatDate(item.published_at);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
      {item.source && (
        <span className="font-bold uppercase tracking-[0.12em] text-aur-primary">{item.source}</span>
      )}
      {item.source && date && <span aria-hidden="true" className="text-slate-300">&bull;</span>}
      {date && <time dateTime={item.published_at}>{date}</time>}
    </div>
  );
}

/** Quiet thumbnail block; falls back to a neutral tile when the article has no image. */
function ArticleImage({ item, className }: { item: ExternalNewsItem; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className ?? ""}`}>
      {item.image ? (
        <img
          src={item.image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Newspaper className="h-8 w-8 text-slate-300" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

/** First article rendered large: image beside a full standfirst. */
function LeadStory({ item }: { item: ExternalNewsItem }) {
  return (
    <article>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aur-primary md:grid-cols-2"
      >
        <ArticleImage item={item} className="h-56 sm:h-64 md:h-full md:min-h-[20rem]" />
        <div className="flex flex-col p-6 sm:p-8">
          <span className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            <span aria-hidden="true" className="h-px w-6 bg-amber-400" />
            Top story
          </span>
          <ArticleMeta item={item} />
          <h2 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-slate-900 transition-colors group-hover:text-aur-primary sm:text-3xl">
            {item.title}
          </h2>
          {item.description && (
            <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-600">{item.description}</p>
          )}
          <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[11px] font-bold uppercase tracking-wider text-aur-primary">
            Read the full story
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </span>
        </div>
      </a>
    </article>
  );
}

/** Remaining articles rendered as compact cards. */
function StoryCard({ item }: { item: ExternalNewsItem }) {
  return (
    <article className="h-full">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aur-primary"
      >
        <ArticleImage item={item} className="h-40 w-full shrink-0" />
        <div className="flex flex-1 flex-col p-5">
          <ArticleMeta item={item} />
          <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-aur-primary">
            {item.title}
          </h3>
          {item.description && (
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{item.description}</p>
          )}
          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[10px] font-bold uppercase tracking-wider text-aur-primary">
            Read
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </span>
        </div>
      </a>
    </article>
  );
}

function NewsSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
        <Skeleton className="h-56 rounded-none bg-slate-100 sm:h-64 md:h-full md:min-h-[20rem]" />
        <div className="space-y-4 p-6 sm:p-8">
          <Skeleton className="h-3 w-24 bg-slate-100" />
          <Skeleton className="h-3 w-40 bg-slate-100" />
          <Skeleton className="h-7 w-full bg-slate-100" />
          <Skeleton className="h-7 w-3/4 bg-slate-100" />
          <Skeleton className="h-3 w-full bg-slate-100" />
          <Skeleton className="h-3 w-5/6 bg-slate-100" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Skeleton className="h-40 w-full rounded-none bg-slate-100" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-3 w-28 bg-slate-100" />
              <Skeleton className="h-4 w-full bg-slate-100" />
              <Skeleton className="h-4 w-2/3 bg-slate-100" />
              <Skeleton className="h-3 w-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * In-app News feed. Renders inside the main app shell (navbar + layout stay put),
 * matching how Rankings, Analytics, and other tabs behave — no standalone page header.
 */
export default function NewsFeed() {
  const { externalNews, loading, error } = useExternalNewsData();
  const [lead, ...rest] = externalNews;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 font-sans sm:px-6 lg:px-8">
      {/* Page heading */}
      <header className="mb-10 border-b border-slate-200 pb-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Newsroom</span>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Asia higher education news
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Coverage of Asian universities, rankings, scholarships, and policy — pulled live from across the web.
        </p>
      </header>

      {loading ? (
        <NewsSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">News couldn&apos;t be loaded.</p>
          <p className="mt-1 text-sm text-slate-500">Check your connection and refresh the page to try again.</p>
        </div>
      ) : externalNews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">No news articles right now.</p>
          <p className="mt-1 text-sm text-slate-500">New coverage is pulled in regularly — check back soon.</p>
        </div>
      ) : (
        <div>
          <LeadStory item={lead} />
          {rest.length > 0 && (
            <section aria-label="More news" className="mt-10">
              <div className="mb-5 flex items-center gap-3">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">More coverage</h2>
                <div aria-hidden="true" className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((item, idx) => (
                  <StoryCard key={item.url || idx} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
