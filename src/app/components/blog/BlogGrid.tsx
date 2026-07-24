"use client";

import { useEffect, useState } from "react";
import type { Article } from "../../data";
import { API_BASE_URL } from "../../lib/universities";
import InsightCard from "./InsightCard";

/** Blog row as returned by the backend /blogs/ endpoint (snake_case). */
interface BackendBlog {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  description: string;
  content: string;
  cover_image: string | null;
  author: string | null;
  read_time: string | null;
  tags: string | null;
  featured: boolean;
  publish_date: string | null;
  created_at: string;
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Map a backend blog to the Article shape the insight cards render. */
function blogToArticle(blog: BackendBlog): Article {
  return {
    id: blog.id,
    title: blog.title,
    subtitle: blog.description ?? "",
    source: blog.author || "AUR Editorial",
    date: formatDate(blog.publish_date) || formatDate(blog.created_at),
    contentSummary: blog.description ?? "",
    image: blog.cover_image ?? "",
    content: blog.content,
    category: blog.category,
    readTime: blog.read_time ?? undefined,
    tags: blog.tags ? blog.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
  };
}

export default function InsightsGrid() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    fetch(`${API_BASE_URL}/blogs/`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load"))))
      .then((data: BackendBlog[]) => {
        if (!active) return;
        const published = (Array.isArray(data) ? data : [])
          .filter((b) => (b.status ?? "Published") === "Published")
          .map(blogToArticle);
        setArticles(published);
        setError(false);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="ref-card flex h-full flex-col overflow-hidden animate-pulse">
            <div className="h-48 w-full bg-slate-100 sm:h-52" />
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-4 w-3/4 rounded bg-slate-100" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-2/3 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--aur-border)] py-16 text-center text-sm text-[var(--aur-text-muted)]">
        Insights couldn&apos;t be loaded right now. Please try again later.
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--aur-border)] py-16 text-center text-sm text-[var(--aur-text-muted)]">
        No insights have been published yet. Check back soon.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <InsightCard key={article.id} article={article} />
      ))}
    </div>
  );
}
