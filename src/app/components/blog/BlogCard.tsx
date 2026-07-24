"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { Article } from "../../data";

interface BlogCardProps {
  article: Article;
}

export default function BlogCard({ article }: BlogCardProps) {
  // Show the cover only when there is a real image; if it 404s we hide it
  // rather than swapping in a placeholder.
  const [showImage, setShowImage] = useState(Boolean(article.image));
  const summary = article.subtitle || article.contentSummary;

  return (
    <article className="h-full">
      <Link
        href={`/blogs/${article.id}`}
        aria-label={`Read ${article.title}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aur-primary"
      >
        <div className="relative h-40 w-full shrink-0 overflow-hidden bg-slate-100">
          {showImage && (
            <Image
              src={article.image}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              onError={() => setShowImage(false)}
            />
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
            {article.category && (
              <span className="font-bold uppercase tracking-[0.12em] text-aur-primary">{article.category}</span>
            )}
            {article.category && article.date && <span aria-hidden="true" className="text-slate-300">&bull;</span>}
            {article.date && <span>{article.date}</span>}
          </div>
          <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-aur-primary">
            {article.title}
          </h3>
          {summary && (
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{summary}</p>
          )}
          <div className="mt-auto pt-4">
            <p className="text-[11px] font-semibold text-slate-700">
              By {article.source}
              {article.readTime ? (
                <span className="font-normal text-slate-500">
                  {" "}
                  <span aria-hidden="true">&bull;</span> {article.readTime}
                </span>
              ) : null}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-aur-primary">
              Read
              <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
