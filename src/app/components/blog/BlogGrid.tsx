"use client";

import { useEffect, useState } from "react";
import type { Article } from "../../data";
import { API_BASE_URL } from "../../lib/universities";
import BlogCard from "./BlogCard";

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

/** Map a backend blog to the Article shape the blog cards render. */
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

export const DUMMY_ARTICLES: Article[] = [
  {
    id: "blog_1",
    title: "The Rise of Transnational Campuses in Southeast Asia",
    subtitle: "How global universities are setting up specialized hubs to attract top regional talent and drive localized innovation.",
    source: "AUR Editorial",
    date: "August 12, 2026",
    contentSummary: "Southeast Asia is seeing a massive influx of international university branches. We explore how these transnational campuses are reshaping local education ecosystems.",
    image: "/blog_images/generated/blog_1_campus.jpg",
    content: "Full content...",
    category: "Trends",
    readTime: "5 min read",
    tags: ["Asia", "Global Education"],
  },
  {
    id: "blog_2",
    title: "AI in University Admissions: Efficiency vs Bias",
    subtitle: "Are we losing the human touch in student selection as neural networks take the wheel?",
    source: "Dr. Chen Wei",
    date: "July 28, 2026",
    contentSummary: "As top-tier institutions adopt AI to pre-screen tens of thousands of applicants, concerns about algorithmic bias grow. We analyze data from five leading universities.",
    image: "/blog_images/generated/blog_2_ai.jpg",
    content: "Full content...",
    category: "Technology",
    readTime: "8 min read",
    tags: ["AI", "Admissions"],
  },
  {
    id: "blog_3",
    title: "Redefining Medical Education in 2030",
    subtitle: "Moving from textbook theory to early clinical immersion using VR and augmented reality.",
    source: "AUR Medical Board",
    date: "July 10, 2026",
    contentSummary: "Medical schools are entirely overhauling their curricula. The traditional two years of classroom lectures are being replaced by immediate clinical exposure.",
    image: "/blog_images/generated/blog_3_medical.jpg",
    content: "Full content...",
    category: "Medicine",
    readTime: "6 min read",
    tags: ["Medical", "Curriculum"],
  },
  {
    id: "blog_4",
    title: "Sustainable Architecture on Campus",
    subtitle: "How zero-carbon buildings are becoming the standard for modern university expansion.",
    source: "Elena Rostova",
    date: "June 22, 2026",
    contentSummary: "From solar-powered dormitories to naturally ventilated lecture halls, universities are leading the charge in sustainable urban development.",
    image: "/blog_images/generated/blog_4_architecture.jpg",
    content: "Full content...",
    category: "Campus Life",
    readTime: "4 min read",
    tags: ["Sustainability", "Architecture"],
  },
  {
    id: "blog_5",
    title: "The Mental Health Crisis in Graduate Schools",
    subtitle: "Why PhD students are facing unprecedented burnout and what institutions must do.",
    source: "AUR Student Welfare",
    date: "June 05, 2026",
    contentSummary: "The pressure to publish and secure funding is pushing young researchers to the brink. We investigate new support structures being implemented across Asia.",
    image: "/blog_images/generated/blog_5_mentalhealth.jpg",
    content: "Full content...",
    category: "Wellbeing",
    readTime: "10 min read",
    tags: ["Mental Health", "PhD"],
  },
  {
    id: "blog_6",
    title: "Next-Gen Robotics in Engineering Curricula",
    subtitle: "Hands-on robotics is replacing traditional mechanics classes in top engineering schools.",
    source: "Tech Insights Team",
    date: "May 18, 2026",
    contentSummary: "By integrating open-source robotics and advanced simulation software into freshman year, engineering departments are producing industry-ready graduates.",
    image: "/blog_images/generated/blog_6_robotics.jpg",
    content: "Full content...",
    category: "Engineering",
    readTime: "7 min read",
    tags: ["Robotics", "Curriculum"],
  }
];

export default function BlogGrid() {
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

  if (error || articles.length === 0) {
    return (
      <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {DUMMY_ARTICLES.map((article) => (
          <BlogCard key={article.id} article={article} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <BlogCard key={article.id} article={article} />
      ))}
    </div>
  );
}
