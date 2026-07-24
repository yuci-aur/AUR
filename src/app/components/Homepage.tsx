/* eslint-disable jsx-a11y/role-has-required-aria-props */
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import NewsFlashWidget from "./NewsFlashWidget";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  BookOpen,
  GraduationCap,
  ChevronRight,
  MapPin,
  Globe2,
  BarChart3,
  Database,
  Clock,
  ArrowRight,
  Bell,
  Building2,
  LineChart,
  Mail,
} from "lucide-react";
import { FEATURED_ARTICLES, University, Article } from "../data";
import { getPublishedStoredBlogs, storedBlogToArticle } from "../lib/blog-storage";
import { useUniversityData } from "./data/UniversityDataProvider";
import { useSidebar } from "./navigation/SidebarContext";
import { isProtectedView } from "./navigation/config";
import "./home/ref-home.css";
import { API_BASE_URL } from "../lib/universities";

/* ── Reusable scroll-reveal wrapper ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={className}
    >
      {children}
    </div>
  );
}

type SuggestionPick =
  | { kind: "uni"; uni: University }
  | { kind: "article"; article: Article }
  | { kind: "view-all" };

const COUNTRY_FLAGS: Record<string, string> = {
  China: "", Singapore: "", Japan: "", "South Korea": "", India: "",
  Malaysia: "", Thailand: "", Vietnam: "", Indonesia: "", Uzbekistan: "",
  Kazakhstan: "", Taiwan: "", "Hong Kong": "", Philippines: "", Pakistan: "",
  Bangladesh: "", Nepal: "", Myanmar: "", Cambodia: "", Mongolia: "",
};

const socialLinks = [
  {
    label: "Twitter",
    imgSrc: "/twitter-logo.png",
    href: "https://twitter.com",
  },
  {
    label: "LinkedIn",
    imgSrc: "/linkedin-logo.png",
    href: "https://www.linkedin.com/company/asia-university-rankings/",
  },
  {
    label: "Instagram",
    imgSrc: "/instagram-logo.png",
    href: "https://www.instagram.com/asiauniversityrankings/",
  },
  {
    label: "YouTube",
    imgSrc: "/youtube-logo.png",
    href: "https://www.youtube.com/",
  },
];

/** Light cards themed around each country's iconic monument */
// Per-country identity: ISO-2 code + national flag + an accent colour.
// No campus photos here — reusing one country's photo for another was
// misleading, so each card now leads with its own flag and colour instead.
const COUNTRY_THEME: Record<string, { code: string; accent: string }> = {
  Singapore: { code: "SG", accent: "#ef4444" },
  "Hong Kong": { code: "HK", accent: "#dc2626" },
  "South Korea": { code: "KR", accent: "#2563eb" },
  China: { code: "CN", accent: "#dc2626" },
  Japan: { code: "JP", accent: "#be123c" },
  India: { code: "IN", accent: "#ea580c" },
  Taiwan: { code: "TW", accent: "#1d4ed8" },
  Malaysia: { code: "MY", accent: "#1e40af" },
  Thailand: { code: "TH", accent: "#b45309" },
  Vietnam: { code: "VN", accent: "#059669" },
  Indonesia: { code: "ID", accent: "#c2410c" },
  Uzbekistan: { code: "UZ", accent: "#0284c7" },
  Kazakhstan: { code: "KZ", accent: "#0891b2" },
  Kyrgyzstan: { code: "KG", accent: "#dc2626" },
  Philippines: { code: "PH", accent: "#2563eb" },
  Pakistan: { code: "PK", accent: "#16a34a" },
  Bangladesh: { code: "BD", accent: "#15803d" },
  "Sri Lanka": { code: "LK", accent: "#d97706" },
  Lebanon: { code: "LB", accent: "#dc2626" },
  Brunei: { code: "BN", accent: "#ca8a04" },
  Nepal: { code: "NP", accent: "#dc2626" },
  Myanmar: { code: "MM", accent: "#ca8a04" },
  Cambodia: { code: "KH", accent: "#b45309" },
  Mongolia: { code: "MN", accent: "#1d4ed8" },
};

function getCountryTheme(country: string) {
  const known = COUNTRY_THEME[country];
  if (known) return known;
  // Unknown / unmapped location: neutral slate accent, first two letters as code.
  return { code: country.slice(0, 2).toUpperCase(), accent: "#64748b" };
}

const LIVE_UPDATES = [
  { text: "New Rankings Published", time: "2 min ago", color: "#f59e0b" },
  { text: "Tsinghua University climbs to #1", time: "15 min ago", color: "#2563eb" },
  { text: "Singapore institutions gain +2.4 avg", time: "32 min ago", color: "#f59e0b" },
];

const METHODOLOGY = [
  { label: "Research Impact", pct: 40, color: "#3b82f6" },
  { label: "Teaching Excellence", pct: 25, color: "#10b981" },
  { label: "Employability", pct: 15, color: "#f59e0b" },
  { label: "International Outlook", pct: 15, color: "#8b5cf6" },
  { label: "Industry Income", pct: 5, color: "#64748b" },
];

function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-100 text-amber-800 px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

/** Real metric score (0–100) shown as a number with a slim colored progress bar. */
function MetricBar({ value, color }: { value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full max-w-20">
      <div className="font-mono text-sm font-semibold text-slate-700 leading-none">
        {value.toFixed(1)}
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function MiniLineChart({ color, trend }: { color: string; trend?: "up" | "down" }) {
  const pts = trend === "down" ? "0,12 12,8 24,10 36,6 48,8" : "0,10 12,8 24,6 36,4 48,2";
  return (
    <svg width="100%" height="48" viewBox="0 0 48 16" preserveAspectRatio="none" className="mt-2">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} opacity="0.9" />
      <polyline fill={`${color}22`} stroke="none" points={`${pts} 48,16 0,16`} />
    </svg>
  );
}

function RadarChart({ universities }: { universities: University[] }) {
  const axes = ["Innovation", "Research", "Teaching", "Employability", "Intl"];
  const n = axes.length;
  const cx = 120;
  const cy = 120;
  const r = 80;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, val: number) => {
    const rad = (val / 100) * r;
    return { x: cx + Math.cos(angle(i)) * rad, y: cy + Math.sin(angle(i)) * rad };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const colors = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6"];

  const getVals = (u: University) => [
    u.research * 0.95,
    u.research,
    u.teaching,
    u.employability,
    u.intlStudents,
  ];

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[280px] mx-auto">
      {gridLevels.map((lvl) => {
        const pts = axes
          .map((_, i) => {
            const p = point(i, lvl * 100);
            return `${p.x},${p.y}`;
          })
          .join(" ");
        return (
          <polygon key={lvl} points={pts} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
        );
      })}
      {axes.map((label, i) => {
        const outer = point(i, 100);
        return (
          <g key={label}>
            <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(148,163,184,0.12)" />
            <text
              x={outer.x + (outer.x - cx) * 0.12}
              y={outer.y + (outer.y - cy) * 0.12}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="8"
            >
              {label}
            </text>
          </g>
        );
      })}
      {universities.map((uni, ui) => {
        const vals = getVals(uni);
        const pts = vals
          .map((v, i) => {
            const p = point(i, v);
            return `${p.x},${p.y}`;
          })
          .join(" ");
        return (
          <polygon
            key={uni.id}
            points={pts}
            fill={`${colors[ui]}22`}
            stroke={colors[ui]}
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}

function getCountryStats(universities: University[]) {
  const map = new Map<string, University[]>();
  universities.forEach((u) => {
    if (!map.has(u.location)) map.set(u.location, []);
    map.get(u.location)!.push(u);
  });
  return Array.from(map.entries())
    .map(([country, unis]) => {
      const sorted = [...unis].sort((a, b) => b.overall - a.overall);
      return {
        country,
        count: unis.length,
        avgScore: unis.reduce((s, u) => s + u.overall, 0) / unis.length,
        topUni: sorted[0],
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 8);
}


type FooterLinkItem = {
  label: string;
  kind: "view" | "route";
  target: string;
};

/** Footer navigation link: SPA views navigate in-app (ungated), route links use Next.js routing. */
function FooterLink({
  item,
  onViewChange,
}: {
  item: FooterLinkItem;
  onViewChange: (view: string) => void;
}) {
  const className =
    "text-sm text-left justify-start text-[#1A365D]/70 hover:text-[#1A365D] hover:translate-x-1 transition-all flex items-center gap-2 w-full";

  if (item.kind === "route") {
    return (
      <Link href={item.target} className={className}>
        {item.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onViewChange(item.target)} className={className}>
      {item.label}
    </button>
  );
}

interface HomepageProps {
  onSearchSubmit: (query: string) => void;
  onUniversitySelect: (id: string) => void;
  onArticleSelect: (article: Article) => void;
  onViewChange: (view: string) => void;
  isAuthenticated?: boolean;
}

export default function Homepage({
  onSearchSubmit,
  onUniversitySelect,
  onArticleSelect,
  onViewChange,
  isAuthenticated = false,
}: HomepageProps) {
  const handleProtectedViewChange = useCallback(
    (targetView: string) => {
      if (!isAuthenticated && isProtectedView(targetView)) {
        onViewChange("login");
      } else {
        onViewChange(targetView);
      }
    },
    [isAuthenticated, onViewChange]
  );

  const { universities } = useUniversityData();
  const { searchQuery, setSearchQuery } = useSidebar();
  const [suggestions, setSuggestions] = useState<{ universities: University[]; articles: Article[] }>({
    universities: [],
    articles: [],
  });

  // Newsletter
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [createdArticles, setCreatedArticles] = useState<Article[]>([]);

  const heroImages = useMemo(() => [
    "/university_images/South-Korea/Seoul National University image.jpg",
    "/university_images/Thailand/Mahidol University image.jpg",
    "/university_images/Indonesia/Universitas Indonesia image.jpg",
    "/university_images/Uzbekistan/Inha University in Tashkent image.jpg",
    "/university_images/China/Fudan University image.jpg",
    "/university_images/China/University of Science and Technology of China image.jpg",
    "/university_images/Hong-kong/The University of Hong Kong image.jpg",
    "/university_images/Taiwan/National Taiwan University image.jpg",
    "/university_images/China/Wuhan University image.jpg"
  ], []);
  const [currentHeroBg, setCurrentHeroBg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroBg((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages]);

  const suggestionRef = useRef<HTMLDivElement>(null);
  const methodologyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCreatedArticles = () => {
      setCreatedArticles(getPublishedStoredBlogs().map(storedBlogToArticle));
    };

    loadCreatedArticles();
    window.addEventListener("storage", loadCreatedArticles);

    return () => window.removeEventListener("storage", loadCreatedArticles);
  }, []);

  const articlesForSearch = useMemo(
    () => [...createdArticles, ...FEATURED_ARTICLES],
    [createdArticles]
  );

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestions({ universities: [], articles: [] });
      return;
    }
    const filteredUnis = universities.filter(
      (uni) =>
        uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uni.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uni.subjects.some((sub) => sub.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 5);
    const filteredArticles = articlesForSearch.filter(
      (art) =>
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3);
    setSuggestions({ universities: filteredUnis, articles: filteredArticles });
  }, [articlesForSearch, searchQuery, universities]);

  const flatSuggestions = useMemo((): SuggestionPick[] => {
    const items: SuggestionPick[] = [];
    suggestions.universities.forEach((uni) => items.push({ kind: "uni", uni }));
    suggestions.articles.forEach((article) => items.push({ kind: "article", article }));
    if (searchQuery.trim().length > 0) items.push({ kind: "view-all" });
    return items;
  }, [suggestions, searchQuery]);

  useEffect(() => setActiveSuggestionIndex(-1), [searchQuery]);

  const activateSuggestion = useCallback(
    (item: SuggestionPick) => {
      if (item.kind === "uni") {
        onUniversitySelect(item.uni.id);
        setShowSuggestions(false);
      } else if (item.kind === "article") {
        onArticleSelect(item.article);
        setShowSuggestions(false);
      } else {
        onSearchSubmit(searchQuery);
        handleProtectedViewChange("rankings");
        setShowSuggestions(false);
      }
    },
    [handleProtectedViewChange, onArticleSelect, onSearchSubmit, onUniversitySelect, searchQuery]
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
      return;
    }
    if (!showSuggestions || flatSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((i) => Math.min(i + 1, flatSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeSuggestionIndex >= 0) {
      e.preventDefault();
      activateSuggestion(flatSuggestions[activeSuggestionIndex]);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery);
      onViewChange("rankings");
      setShowSuggestions(false);
    }
  };

  const topTen = useMemo(
    () => [...universities].sort((a, b) => b.overall - a.overall).slice(0, 10),
    [universities]
  );

  const countryStats = useMemo(() => getCountryStats(universities), [universities]);
  const compareUnis = topTen.slice(0, 4);
  const uniqueCountries = useMemo(() => new Set(universities.map((u) => u.location)).size, [universities]);
  const mapUniversities = topTen.slice(0, 3);

  const scrollToMethodology = () => {
    // Navigated via onViewChange("methodology") — scroll ref no longer needed
  };

  const handleSubscribe = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setStatus("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/newsletter/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: trimmedEmail }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Subscription failed.");
      }

      setStatus("Thank you for subscribing!");
      setEmail("");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to connect. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ref-home flex-grow w-full relative">


      {/* ── Hero Image Slider ── */}
      <section className="relative w-full h-[45vh] lg:h-[55vh] overflow-hidden">
        {heroImages.map((src, idx) => (
          <div
            key={src}
            className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${idx === currentHeroBg ? 'opacity-100' : 'opacity-0'}`}
          >
            <Image
              src={src}
              alt="University"
              fill
              className="object-cover"
              priority={idx === 0}
            />
          </div>
        ))}
        {/* Shorter, less intense gradient at the bottom for a subtle blend */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--background)] to-transparent z-10 opacity-75" />
      </section>

      {/* ── Hero Content (Below Image) ── */}
      <section className="relative z-20 w-full bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto text-center flex flex-col items-center"
        >
          <span className="ref-label text-[10px] sm:text-xs">Asia University Rankings</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mt-4 mb-6 text-[var(--aur-text-secondary)]">
            Asia&apos;s Most Trusted{" "}
            <span className="text-[var(--aur-text)]">University Intelligence</span> Platform
          </h1>
          <p className="text-[var(--aur-text-muted)] text-sm sm:text-base leading-relaxed max-w-3xl mx-auto mb-10">
            Filter institutional indicators, compare global rankings, and explore regional study models
            including medical careers in Central Asia — powered by live audited data.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <button type="button" className="bg-[#1A365D] hover:bg-slate-800 text-white font-bold rounded-lg px-8 py-3.5 text-sm transition-colors" onClick={() => onViewChange("rankings")}>
              Explore Rankings
              <ArrowRight className="h-4 w-4 ml-2 inline" />
            </button>
            {/* <button type="button" className="bg-transparent border-2 border-[#1A365D] text-[#1A365D] hover:bg-slate-50 font-bold rounded-lg px-8 py-3.5 text-sm transition-colors" onClick={() => onViewChange("methodology")}>
              <BookOpen className="h-4 w-4 mr-2 inline" />
              Our Methodology
            </button> */}
          </div>

          {/* Search */}
          <div className="relative w-full max-w-2xl mx-auto mb-4" ref={suggestionRef}>
            <form onSubmit={handleSearchSubmit} className="flex rounded-full overflow-hidden border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-[#0514b5] focus-within:border-transparent transition-all">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ref-muted)]" />
                <input
                  type="search"
                  role="combobox"
                  aria-expanded={showSuggestions && searchQuery.trim().length > 0}
                  placeholder="Search universities, locations, subjects..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full bg-white text-sm text-slate-900 pl-11 pr-4 py-3.5 focus:outline-none"
                />
              </div>
              <button type="submit" className="bg-[#1A365D] hover:bg-slate-800 text-white font-semibold px-8 py-3.5 text-sm transition-colors whitespace-nowrap">
                Search
              </button>
            </form>

            {showSuggestions && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 z-30 mt-1 ref-card max-h-80 overflow-y-auto">
                {(() => {
                  let rowIndex = -1;
                  return (
                    <>
                      <div className="p-3 border-b border-[var(--ref-border)]">
                        <div className="ref-label text-[9px] mb-2 flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" /> Universities
                        </div>
                        {suggestions.universities.length > 0 ? (
                          <ul className="space-y-1">
                            {suggestions.universities.map((uni) => {
                              rowIndex += 1;
                              const active = activeSuggestionIndex === rowIndex;
                              return (
                                <li key={uni.id}>
                                  <button
                                    type="button"
                                    onClick={() => activateSuggestion({ kind: "uni", uni })}
                                    className={`w-full text-left flex justify-between p-2 text-xs rounded-none ${active ? "bg-amber-50" : "hover:bg-slate-50"}`}
                                  >
                                    <span className="font-semibold truncate pr-2">{highlightMatch(uni.name, searchQuery)}</span>
                                    <span className="text-[var(--ref-muted)] shrink-0">{uni.location}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-xs text-[var(--ref-muted)] italic p-2">No universities found</p>
                        )}
                      </div>
                      <div className="p-3 border-b border-[var(--ref-border)]">
                        <div className="ref-label text-[9px] mb-2 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> Articles
                        </div>
                        {suggestions.articles.map((art) => {
                          rowIndex += 1;
                          return (
                            <button
                              key={art.id}
                              type="button"
                              onClick={() => activateSuggestion({ kind: "article", article: art })}
                              className="w-full text-left p-2 text-xs hover:bg-slate-50 rounded-none block"
                            >
                              {highlightMatch(art.title, searchQuery)}
                            </button>
                          );
                        })}
                      </div>
                      <div className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => activateSuggestion({ kind: "view-all" })}
                          className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider"
                        >
                          View all matching &quot;{searchQuery}&quot;
                          <ChevronRight className="inline h-3 w-3" />
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 items-center justify-center mb-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ref-muted)]">Trending:</span>
            {["Uzbekistan", "Medicine", "National Univ Singapore", "English medium"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchQuery(tag);
                  onSearchSubmit(tag);
                  handleProtectedViewChange("rankings");
                }}
                className="text-[10px] px-2.5 py-1 rounded-full border border-blue-200 bg-white text-slate-600 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

        </motion.div>
      </section>

      {/* ── Live Top 10 ── */}
      <RevealSection className="ref-section">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <span className="ref-label">Rankings Engine</span>
            <h2 className="text-2xl font-bold mt-1">Live Top 10 Universities</h2>
          </div>
          <button type="button" className="ref-btn-primary text-[11px]" onClick={() => handleProtectedViewChange("rankings")}>
            Analyze All Universities
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="relative z-0">
          {/* Ambient Liquid Glass Orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] max-w-4xl h-full max-h-96 bg-gradient-to-r from-blue-500/5 via-blue-400/5 to-transparent rounded-full blur-[100px] pointer-events-none -z-10" />
          
          <div className="flex flex-col gap-3">
            {/* Header Row */}
            <div className="grid grid-cols-[3rem_minmax(120px,1fr)_120px_60px] md:grid-cols-[3rem_minmax(140px,1.5fr)_120px_70px_1fr_1fr] lg:grid-cols-[3rem_minmax(140px,2fr)_120px_70px_1fr_1fr_1fr] gap-4 px-6 pb-2 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
              <div className="text-center">Rank</div>
              <div>University</div>
              <div>Country</div>
              <div>Score</div>
              <div className="hidden md:block">Research</div>
              <div className="hidden md:block">Employability</div>
              <div className="hidden lg:block">International</div>
            </div>

            {/* List Items */}
            {topTen.map((uni, idx) => {
              return (
                <motion.div
                  key={uni.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="group relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 cursor-pointer"
                  onClick={() => onUniversitySelect(uni.id)}
                >
                  {/* Hover Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-[#1A365D]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  {/* Content Grid */}
                  <div className="relative z-10 grid grid-cols-[3rem_minmax(120px,1fr)_120px_60px] md:grid-cols-[3rem_minmax(140px,1.5fr)_120px_70px_1fr_1fr] lg:grid-cols-[3rem_minmax(140px,2fr)_120px_70px_1fr_1fr_1fr] gap-4 items-center px-6 py-4 md:py-5">
                    
                    {/* Rank */}
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 shadow-sm ${idx < 3 ? "bg-orange-50 text-orange-600 group-hover:bg-orange-100 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,165,0,0.3)]" : "bg-slate-50/80 text-slate-500 group-hover:bg-slate-100 group-hover:scale-110"}`}>
                        {idx + 1}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="font-semibold text-slate-800 truncate transition-colors duration-300 group-hover:text-[#1A365D]">
                      {uni.name}
                    </div>

                    {/* Country */}
                    <div className="text-slate-600 text-sm flex items-center">
                      <span className="mr-2 text-base opacity-90 drop-shadow-sm">{COUNTRY_FLAGS[uni.location] ?? ""}</span>
                      <span className="truncate">{uni.location}</span>
                    </div>

                    {/* Score */}
                    <div className="font-mono font-bold text-slate-700 text-sm">
                      {uni.overall.toFixed(1)}
                    </div>


                    {/* Metric scores — real 0–100 values with a colored bar */}
                    <div className="hidden md:block">
                      <MetricBar value={uni.research} color="#3b82f6" />
                    </div>
                    <div className="hidden md:block">
                      <MetricBar value={uni.employability} color="#10b981" />
                    </div>
                    <div className="hidden lg:block">
                      <MetricBar value={uni.intlStudents} color="#8b5cf6" />
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        <p className="text-[10px] text-[var(--ref-muted)] mt-3">* Filterable by location, program &amp; tuition in Rankings Engine.</p>
      </RevealSection>

      {/* ── Explore by Country (light cards, per-country theme) ── */}
      <RevealSection className="ref-section pt-0">
        <span className="ref-label">Regional Intelligence</span>
        <h2 className="text-2xl font-bold mt-1 mb-6">Explore by Country</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {countryStats.map((c) => {
            const theme = getCountryTheme(c.country);
            return (
              <button
                key={c.country}
                type="button"
                style={{ "--country-accent": theme.accent } as React.CSSProperties}
                className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-(--aur-border) bg-(--aur-surface) text-left text-(--aur-text) shadow-(--aur-shadow-sm) transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-(--aur-shadow-lg)"
                onClick={() => {
                  onSearchSubmit(c.country);
                  onViewChange("rankings");
                }}
              >
                {/* Image banner — top university's campus photo with an accent tint */}
                <div className="relative h-36 overflow-hidden bg-(--aur-surface-2)">
                  {c.topUni.campusPhoto && (
                    <img
                      src={c.topUni.campusPhoto}
                      alt={`${c.topUni.name} campus`}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  {/* Accent + dark gradient wash for legibility of the overlaid text */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(11,18,32,0.72) 0%, rgba(11,18,32,0.15) 45%, color-mix(in srgb, var(--country-accent) 30%, transparent) 100%)",
                    }}
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-black tracking-tight text-white/10">
                    {theme.code}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[0.6875rem] font-semibold text-white/95 backdrop-blur-sm">
                    {c.count} {c.count === 1 ? "university" : "universities"}
                  </span>
                </div>

                {/* Info block — meta line + big title */}
                <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
                  <div className="text-xs font-medium text-(--aur-text-muted)">
                    Rank {theme.code} · Avg {c.avgScore.toFixed(1)}
                  </div>
                  <h3 className="mt-1 truncate text-xl font-bold leading-tight text-(--aur-text)">
                    {c.country}
                  </h3>

                  {/* Divider */}
                  <div className="my-4 h-px w-full bg-(--aur-border)" />

                  {/* Footer row — top university on the left, action on the right */}
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-(--aur-text)">
                        {c.topUni.name}
                      </div>
                      <div className="text-xs text-(--aur-text-muted)">Top ranked</div>
                    </div>
                    <span className="shrink-0 rounded-lg border border-(--aur-border-strong) px-3.5 py-2 text-xs font-semibold text-(--aur-text) transition-colors group-hover:border-(--country-accent) group-hover:text-(--country-accent)">
                      Explore
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Section-level CTA — jump to the full rankings/directory */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => onViewChange("rankings")}
            className="inline-flex items-center gap-2 rounded-lg border border-(--aur-border-strong) px-6 py-3 text-sm font-semibold text-(--aur-text) transition-colors hover:border-(--aur-text) hover:bg-(--aur-surface-hover)"
          >
            Explore more
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </RevealSection>

      {/* ── News Flash ── */}
      <RevealSection className="ref-section pt-0">
        <NewsFlashWidget />
      </RevealSection>


      {/* ── CTA Banner ── */}
      <RevealSection className="ref-section pt-0 pb-8">
        <div className="ref-cta-banner p-8 md:p-12">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">
              Discover the Future of Higher Education Intelligence
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              Access live rankings, institutional analytics, and regional insights trusted across Asia.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button type="button" className="bg-white hover:bg-slate-100 text-[#1A365D] font-bold rounded-lg px-8 py-3.5 text-sm transition-colors" onClick={() => handleProtectedViewChange("rankings")}>
                Explore Rankings
              </button>
              <a href="mailto:sales@asiauniversityrankings.com?subject=Institutional%20access%20request" className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold rounded-lg px-8 py-3.5 text-sm transition-colors inline-block">
                Request Institutional Access
              </a>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── Footer block ── */}
      <footer className="w-full bg-white text-[#1A365D] pt-8 pb-8 px-6 lg:px-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 mb-12">
            <div className="md:col-span-4 flex flex-col">
              <div className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Asia University Rankings Logo"
                  width={180}
                  height={79}
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
              <p className="text-sm text-[#1A365D]/70 leading-relaxed mb-4">
                The definitive intelligence platform for higher education across Asia and Central Asia. Empowering students, educators, and institutions globally.
              </p>

              {/* Social Media */}
              <div className="flex flex-wrap items-center gap-3">
                {socialLinks.filter(s => s.label !== "Twitter" && s.label !== "YouTube").map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors duration-200">
                      <Image
                        src={social.imgSrc}
                        alt={social.label}
                        width={18}
                        height={18}
                        className="object-contain"
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 md:col-start-5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#152a5e] mb-5">Platform</h4>
              <ul className="space-y-3">
                {([
                  { label: "Rankings Engine", kind: "view", target: "rankings" },
                  { label: "Discovery Hub", kind: "view", target: "home" },
                  { label: "Analytics", kind: "view", target: "analytics" },
                  { label: "Compare Institutions", kind: "view", target: "saved" },
                ] as const).map((item) => (
                  <li key={item.label}>
                    <FooterLink item={item} onViewChange={onViewChange} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#152a5e] mb-5">Resources</h4>
              <ul className="space-y-3">
                {([
                  { label: "Blog", kind: "view", target: "blog" },
                  { label: "News & Updates", kind: "view", target: "news" },
                ] as const).map((item) => (
                  <li key={item.label}>
                    <FooterLink item={item} onViewChange={onViewChange} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom section */}
          <div className="pt-8 border-t border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <span className="text-xs text-[#1A365D]/60">© 2026 Asia University Rankings. All rights reserved.</span>
              <div className="flex gap-4 text-xs text-[#1A365D]/60">
                <button type="button" className="hover:text-[#1A365D] transition-colors">Cookie Policy</button>
              </div>
            </div>

            <div className="w-full lg:w-auto">
              <form
                onSubmit={handleSubscribe}
                className="flex w-full lg:w-auto items-center gap-2 bg-slate-100 p-1.5 rounded-full border border-slate-300 focus-within:border-[#1A365D]/40 focus-within:bg-slate-200 transition-all"
              >
                <div className="pl-4 hidden sm:block">
                  <Mail className="h-4 w-4 text-[#1A365D]/60" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Subscribe to our newsletter..."
                  required
                  className="bg-transparent border-none px-3 py-1.5 text-sm text-[#1A365D] placeholder:text-[#1A365D]/40 w-full sm:w-64 focus:outline-none focus:ring-0"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1A365D] hover:bg-[#1A365D]/90 text-white font-bold text-xs px-6 py-2.5 rounded-full transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {loading ? "..." : "Subscribe"}
                </button>
              </form>
              {status && (
                <div className="text-right mt-2 text-xs pr-4">
                  <span className={status.includes("Thank") ? "text-emerald-600" : "text-amber-600"}>
                    {status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
