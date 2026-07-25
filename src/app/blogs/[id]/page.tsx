"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, BookOpen, Tag, Calendar, User } from "lucide-react";
import Link from "next/link";
import AppLayout from "../../components/layout/AppLayout";
import { SidebarProvider } from "../../components/navigation/SidebarContext";
import { ToastProvider } from "../../components/feedback/ToastContext";
import { UniversityDataProvider } from "../../components/data/UniversityDataProvider";
import { Article } from "../../data";
import { API_BASE_URL } from "../../lib/universities";
import { DUMMY_ARTICLES } from "../../components/blog/BlogGrid";

function formatBlogDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Map the backend blog (snake_case) to the Article shape this page renders. */
function backendBlogToArticle(b: {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  cover_image: string | null;
  author: string | null;
  read_time: string | null;
  tags: string | null;
  publish_date: string | null;
  created_at: string;
}): Article {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.description ?? "",
    source: b.author || "AUR Editorial",
    date: formatBlogDate(b.publish_date) || formatBlogDate(b.created_at),
    contentSummary: b.description ?? "",
    image: b.cover_image ?? "",
    content: b.content,
    category: b.category,
    readTime: b.read_time ?? undefined,
    tags: b.tags ? b.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
  };
}

function BlogDetailsContent() {
  const params = useParams();
  const id = params?.id as string;

  const [blog, setBlog] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track whether the cover image is available; hide it (no placeholder) when
  // the post has no image or its URL fails to load.
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchBlog() {
      try {
        const res = await fetch(`${API_BASE_URL}/blogs/${id}`);
        if (!res.ok) {
          // Fallback to mock data if API fails
          const mockArticle = DUMMY_ARTICLES.find((a) => a.id === id);
          if (mockArticle) {
            setBlog(mockArticle);
            setShowImage(Boolean(mockArticle.image));
            setError(null);
          } else {
            setError(res.status === 404 ? "Blog not found" : "Failed to load blog");
          }
          return;
        }
        const data = await res.json();
        const article = backendBlogToArticle(data);
        setBlog(article);
        setShowImage(Boolean(article.image));
      } catch (err) {
        console.error(err);
        setError("Network error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchBlog();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-grow flex flex-col items-center justify-center py-24 animate-pulse">
          <BookOpen className="h-10 w-10 text-amber-700 dark:text-cyber-yellow mb-4 animate-bounce" />
          <span className="text-xs uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 font-mono">
            Decrypting Article Ledger...
          </span>
        </div>
      </AppLayout>
    );
  }

  if (error || !blog) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto my-12 p-8 border border-slate-200 dark:border-cyber-border rounded-xl bg-slate-50/50 dark:bg-cyber-dark/40 shadow-sm text-center space-y-6 animate-fadeIn">
          <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 flex items-center justify-center mx-auto text-red-650 dark:text-red-400 font-serif text-xl font-bold">
            !
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-red-650 dark:text-red-400">
              Error: 404
            </span>
            <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Article Node Not Found
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              The requested article identifier could not be verified in the decentralized academic database indices. It may have been archived or removed.
            </p>
          </div>
          <Link
            href="/?view=blog"
            className="inline-flex items-center justify-center border border-slate-900 dark:border-cyber-yellow bg-slate-900 dark:bg-transparent px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white dark:text-cyber-yellow hover:bg-slate-800 dark:hover:bg-cyber-yellow dark:hover:text-cyber-black transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-2" />
            Back to Blog
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Readable content colors — the Tailwind `prose`/slate utilities are not
          reliably generated in this build, so colors are set explicitly here
          using the project tokens (deliberately no white text on light bg). */}
      <style jsx global>{`
        .blog-content,
        .blog-content p,
        .blog-content li,
        .blog-content span {
          color: var(--aur-text-secondary, #2d3748);
        }
        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content strong,
        .blog-content b {
          color: var(--aur-text, #1a365d);
          font-weight: 700;
        }
        .blog-content h2 {
          font-size: 1.25rem;
          margin-top: 2rem;
          margin-bottom: 0.5rem;
        }
        .blog-content h3 {
          font-size: 1.125rem;
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .blog-content p {
          margin-bottom: 1rem;
        }
        .blog-content ul {
          list-style: disc;
          padding-left: 1.25rem;
          margin-bottom: 1rem;
        }
        .blog-content a {
          color: var(--aur-navy-2, #1a365d);
          text-decoration: underline;
        }
      `}</style>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/?view=blog"
            style={{ color: "var(--aur-navy, #14213D)" }}
            className="inline-flex items-center text-xs font-bold uppercase tracking-wider hover:opacity-70 transition-opacity group"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Blog
          </Link>
        </div>

        <article className="space-y-6">
          {/* Category badge */}
          {blog.category && (
            <div>
              <span
                className="inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 border font-mono"
                style={{
                  color: "#ffffff",
                  backgroundColor: "var(--aur-navy, #14213D)",
                  borderColor: "var(--aur-navy, #14213D)",
                }}
              >
                {blog.category}
              </span>
            </div>
          )}

          {/* Title */}
          <h1
            style={{ color: "var(--aur-text, #1A365D)" }}
            className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight leading-tight"
          >
            {blog.title}
          </h1>

          {/* Subtitle */}
          {blog.subtitle && (
            <p className="font-serif text-lg italic text-slate-600 leading-relaxed border-l-2 border-slate-300 dark:border-cyber-yellow pl-4">
              {blog.subtitle}
            </p>
          )}

          {/* Author / Date / Read time metadata */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 py-4 border-y border-slate-200 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-500 font-mono">
            <span className="flex items-center">
              <User className="h-3.5 w-3.5 mr-1.5 text-slate-300 dark:text-slate-600" />
              {blog.source}
            </span>
            <span className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-300 dark:text-slate-600" />
              {blog.date}
            </span>
            <span className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-300 dark:text-slate-600" />
              {blog.readTime}
            </span>
          </div>

          {/* Featured Image — only shown when the post has a working cover */}
          {showImage && (
            <div className="relative aspect-video w-full border border-slate-200 dark:border-cyber-border overflow-hidden bg-slate-100 dark:bg-cyber-gray">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blog.image}
                alt={blog.title}
                className="h-full w-full object-cover object-center"
                onError={() => setShowImage(false)}
              />
            </div>
          )}

          {/* Blog Rich HTML Content */}
          <div
            className="blog-content max-w-none text-sm leading-relaxed space-y-6 pt-4 font-sans"
            style={{ color: "var(--aur-text-secondary, #2D3748)" }}
            dangerouslySetInnerHTML={{ __html: blog.content || `<p>${blog.contentSummary}</p>` }}
          />

          {/* Tags list */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center">
                <Tag className="h-3 w-3 mr-1" />
                Tags:
              </span>
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-cyber-gray font-mono rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </div>
    </AppLayout>
  );
}

export default function BlogDetailsPage() {
  return (
    <React.Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-cyber-black font-sans text-slate-400 text-xs font-bold uppercase tracking-widest">
        Initializing Engine...
      </div>
    }>
      <ToastProvider>
        <SidebarProvider>
          <UniversityDataProvider>
            <BlogDetailsContent />
          </UniversityDataProvider>
        </SidebarProvider>
      </ToastProvider>
    </React.Suspense>
  );
}
