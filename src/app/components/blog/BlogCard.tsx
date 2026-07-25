"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { Article } from "../../data";
import "../home/ref-home.css";

interface BlogCardProps {
  article: Article;
}

export default function BlogCard({ article }: BlogCardProps) {
  // Show the cover only when there is a real image; if it 404s we hide it
  // rather than swapping in a placeholder.
  const [showImage, setShowImage] = useState(Boolean(article.image));
  const summary = article.subtitle || article.contentSummary;

  return (
    <article className="aur-card group flex h-full min-w-0 flex-col overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10">
      <Link
        href={`/blogs/${article.id}`}
        aria-label={`Read ${article.title}`}
        className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
      >
        <div className="relative h-56 w-full shrink-0 overflow-hidden bg-[var(--aur-surface-2)]">
          {showImage && (
            <Image
              src={article.image}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setShowImage(false)}
            />
          )}
          {article.category && (
            <div className="absolute top-4 left-4 z-10">
              <span className="aur-chip bg-white/90 dark:bg-black/90 backdrop-blur-md text-black dark:text-white border-transparent">
                {article.category}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-6 md:p-8 relative">
          <div className="absolute top-0 right-8 -translate-y-1/2 w-10 h-10 bg-[var(--aur-surface)] rounded-full flex items-center justify-center border border-[var(--aur-border)] shadow-sm opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-[-50%] text-blue-500">
            <ArrowRight className="w-4 h-4" />
          </div>
          <p className="text-xs font-mono text-[var(--aur-text-muted)] mb-3">
            {article.date} {article.readTime ? `• ${article.readTime}` : ""}
          </p>
          <h3 className="mb-3 line-clamp-2 text-xl font-bold leading-tight text-[var(--aur-text)] transition-colors duration-300 group-hover:text-blue-500 dark:group-hover:text-blue-400">
            {article.title}
          </h3>
          <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-[var(--aur-text-secondary)]">{summary}</p>
          <div className="mt-auto pt-4 border-t border-[var(--aur-border)]">
            <p className="text-xs font-semibold text-[var(--aur-text)]">By {article.source}</p>
          </div>
        </div>
      </Link>
    </article>
  );
}
