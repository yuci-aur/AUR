"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Article } from "../../types";
import { listPublishedBlogs, type FirestoreBlog } from "../../lib/firebase-content";
import BlogCard from "./BlogCard";

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Map a Firestore blog document to the Article shape the blog cards render. */
function blogToArticle(blog: FirestoreBlog): Article {
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

/** First post rendered large, mirroring the newsroom lead-story card. */
function LeadPost({ article }: { article: Article }) {
  const [showImage, setShowImage] = useState(Boolean(article.image));
  const summary = article.subtitle || article.contentSummary;

  return (
    <article>
      <Link
        href={`/blogs/${article.id}`}
        aria-label={`Read ${article.title}`}
        className="group grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aur-primary md:grid-cols-2"
      >
        <div className="relative h-56 overflow-hidden bg-slate-100 sm:h-64 md:h-full md:min-h-[20rem]">
          {showImage && (
            <Image
              src={article.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              onError={() => setShowImage(false)}
            />
          )}
        </div>
        <div className="flex flex-col p-6 sm:p-8">
          <span className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            <span aria-hidden="true" className="h-px w-6 bg-amber-400" />
            Latest post
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
            {article.category && (
              <span className="font-bold uppercase tracking-[0.12em] text-aur-primary">{article.category}</span>
            )}
            {article.category && article.date && <span aria-hidden="true" className="text-slate-300">&bull;</span>}
            {article.date && <span>{article.date}</span>}
          </div>
          <h2 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-slate-900 transition-colors group-hover:text-aur-primary sm:text-3xl">
            {article.title}
          </h2>
          {summary && <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-600">{summary}</p>}
          <div className="mt-auto pt-6">
            <p className="text-[11px] font-semibold text-slate-700">
              By {article.source}
              {article.readTime ? (
                <span className="font-normal text-slate-500">
                  {" "}
                  <span aria-hidden="true">&bull;</span> {article.readTime}
                </span>
              ) : null}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-aur-primary">
              Read the post
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function BlogSkeleton() {
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Skeleton className="h-40 w-full rounded-none bg-slate-100" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-3 w-20 bg-slate-100" />
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

export default function BlogGrid() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    listPublishedBlogs()
      .then((data) => {
        if (!active) return;
        setArticles(data.map(blogToArticle));
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
    };
  }, []);

  if (loading) {
    return <BlogSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
        <p className="text-sm font-semibold text-slate-700">The blog couldn&apos;t be loaded.</p>
        <p className="mt-1 text-sm text-slate-500">Check your connection and refresh the page to try again.</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
        <p className="text-sm font-semibold text-slate-700">No posts have been published yet.</p>
        <p className="mt-1 text-sm text-slate-500">New writing lands here once it&apos;s published — check back soon.</p>
      </div>
    );
  }

  const [lead, ...rest] = articles;

  return (
    <div>
      <LeadPost article={lead} />
      {rest.length > 0 && (
        <section aria-label="More posts" className="mt-10">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">More from the blog</h2>
            <div aria-hidden="true" className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((article) => (
              <BlogCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
