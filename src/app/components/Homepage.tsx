"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import NewsFlashWidget from "./NewsFlashWidget";
import Image from "next/image";
import {
  Search,
  BookOpen,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Mail,
  Scale,
  BarChart3,
  Bot,
  Users,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { FEATURED_ARTICLES, University, Article } from "../data";
import { getPublishedStoredBlogs, storedBlogToArticle } from "../lib/blog-storage";
import { useUniversityData } from "./data/UniversityDataProvider";
import { useSidebar } from "./navigation/SidebarContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import "./home/ref-home.css";
import { API_BASE_URL } from "../lib/universities";

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

type SuggestionPick =
  | { kind: "uni"; uni: University }
  | { kind: "article"; article: Article }
  | { kind: "view-all" };

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
const COUNTRY_THEME: Record<
  string,
  { code: string; monument: string; accent: string; bg: string; image: string; imagePos?: string }
> = {
  Singapore: {
    code: "SG",
    monument: "Marina Bay Sands",
    accent: "#ef4444",
    bg: "linear-gradient(135deg, #fff5f5 0%, #ffffff 62%)",
    image: "/university_images/Singapore/National University of Singapore image.jpg",
    imagePos: "70% center",
  },
  "Hong Kong": {
    code: "HK",
    monument: "Victoria Harbour",
    accent: "#dc2626",
    bg: "linear-gradient(135deg, #fff7f7 0%, #ffffff 62%)",
    image: "/university_images/Hong-kong/The University of Hong Kong image.jpg",
    imagePos: "center 40%",
  },
  "South Korea": {
    code: "KR",
    monument: "Gyeongbokgung Palace",
    accent: "#2563eb",
    bg: "linear-gradient(135deg, #eff6ff 0%, #ffffff 62%)",
    image: "/university_images/South-Korea/Seoul National University image.jpg",
    imagePos: "center",
  },
  China: {
    code: "CN",
    monument: "Great Wall of China",
    accent: "#dc2626",
    bg: "linear-gradient(135deg, #fffbeb 0%, #ffffff 62%)",
    image: "/university_images/China/Fudan University image.jpg",
    imagePos: "center",
  },
  Japan: {
    code: "JP",
    monument: "Mount Fuji",
    accent: "#be123c",
    bg: "linear-gradient(135deg, #fff1f2 0%, #ffffff 62%)",
    image: "/university_images/Japan/Kyoto University image.jpg",
    imagePos: "center 35%",
  },
  India: {
    code: "IN",
    monument: "Taj Mahal",
    accent: "#ea580c",
    bg: "linear-gradient(135deg, #fff7ed 0%, #ffffff 55%, #f0fdf4 100%)",
    image: "/university_images/India/IIT Delhi image.jpg",
    imagePos: "center",
  },
  Taiwan: {
    code: "TW",
    monument: "Taipei 101",
    accent: "#1d4ed8",
    bg: "linear-gradient(135deg, #eff6ff 0%, #ffffff 62%)",
    image: "/university_images/Taiwan/National Taiwan University image.jpg",
    imagePos: "center bottom",
  },
  Malaysia: {
    code: "MY",
    monument: "Petronas Towers",
    accent: "#1e40af",
    bg: "linear-gradient(135deg, #eff6ff 0%, #ffffff 55%, #fefce8 100%)",
    image: "/university_images/Malaysia/Universiti Malaya image.jpg",
    imagePos: "center",
  },
  Thailand: {
    code: "TH",
    monument: "Wat Arun",
    accent: "#b45309",
    bg: "linear-gradient(135deg, #fffbeb 0%, #ffffff 62%)",
    image: "/university_images/Thailand/Mahidol University image.jpg",
    imagePos: "center",
  },
  Vietnam: {
    code: "VN",
    monument: "Ha Long Bay",
    accent: "#059669",
    bg: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 62%)",
    image: "",
  },
  Indonesia: {
    code: "ID",
    monument: "Borobudur Temple",
    accent: "#c2410c",
    bg: "linear-gradient(135deg, #fff7ed 0%, #ffffff 62%)",
    image: "/university_images/Indonesia/Universitas Indonesia image.jpg",
    imagePos: "center",
  },
  Uzbekistan: {
    code: "UZ",
    monument: "Registan, Samarkand",
    accent: "#0284c7",
    bg: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 62%)",
    image: "/university_images/Uzbekistan/Central Asian University (former AKFA) image.jpg",
    imagePos: "center",
  },
  Kazakhstan: {
    code: "KZ",
    monument: "Bayterek Tower",
    accent: "#0891b2",
    bg: "linear-gradient(135deg, #ecfeff 0%, #ffffff 62%)",
    image: "",
  },
  Philippines: {
    code: "PH",
    monument: "Mayon Volcano",
    accent: "#2563eb",
    bg: "linear-gradient(135deg, #eff6ff 0%, #ffffff 62%)",
    image: "",
  },
  Pakistan: {
    code: "PK",
    monument: "Faisal Mosque",
    accent: "#16a34a",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 62%)",
    image: "",
  },
  Bangladesh: {
    code: "BD",
    monument: "Sixty Dome Mosque",
    accent: "#15803d",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 62%)",
    image: "",
  },
  Nepal: {
    code: "NP",
    monument: "Boudhanath Stupa",
    accent: "#dc2626",
    bg: "linear-gradient(135deg, #fff7ed 0%, #ffffff 62%)",
    image: "",
  },
  Myanmar: {
    code: "MM",
    monument: "Shwedagon Pagoda",
    accent: "#ca8a04",
    bg: "linear-gradient(135deg, #fefce8 0%, #ffffff 62%)",
    image: "",
  },
  Cambodia: {
    code: "KH",
    monument: "Angkor Wat",
    accent: "#b45309",
    bg: "linear-gradient(135deg, #fff7ed 0%, #ffffff 62%)",
    image: "",
  },
  Mongolia: {
    code: "MN",
    monument: "Genghis Khan Statue",
    accent: "#1d4ed8",
    bg: "linear-gradient(135deg, #eff6ff 0%, #ffffff 62%)",
    image: "",
  },
};

/* ── Landing-page content ── */

// Mirrors backend/engine/weights.json (methodology version QS-Asia-2026).
const METHODOLOGY_WEIGHTS = [
  { label: "Academic Reputation", pct: 30 },
  { label: "Employer Reputation", pct: 20 },
  { label: "Faculty–Student Ratio", pct: 10 },
  { label: "Citations per Paper", pct: 10 },
  { label: "International Research Network", pct: 10 },
  { label: "International mix (students, faculty, exchange, output)", pct: 20 },
] as const;

const FAQS = [
  {
    q: "How are the rankings calculated?",
    a: "Each university's overall score is a weighted blend of eleven indicators: academic reputation (30%), employer reputation (20%), faculty–student ratio, citations per paper and international research network (10% each), with the remaining 20% covering research output and international students, faculty and exchange programs.",
  },
  {
    q: "Is AUR affiliated with QS, Times Higher Education, or ARWU?",
    a: "No. Asia University Rankings is an independent platform. Our dataset is compiled and maintained by our own editorial team; it is not endorsed by or affiliated with any other ranking organisation.",
  },
  {
    q: "Do I need an account to browse the rankings?",
    a: "No — rankings, university profiles, country pages and analytics are free to browse. A free account adds saved shortlists, side-by-side comparisons and personalised preferences.",
  },
  {
    q: "How do universities get listed or update their profile?",
    a: "Institutions can request access through our institutional registration. Verified representatives can submit corrections, upload media and take part in events and awards.",
  },
  {
    q: "How often is the data updated?",
    a: "Rankings follow an annual cycle, with corrections and profile updates published continuously as they are verified.",
  },
] as const;

function getCountryTheme(country: string) {
  return (
    COUNTRY_THEME[country] ?? {
      code: country.slice(0, 2).toUpperCase(),
      monument: country,
      accent: "#f97316",
      bg: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
      image: "",
    }
  );
}

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
  // Only account-bound views require sign-in; browsing stays open to visitors.
  const handleProtectedViewChange = useCallback(
    (targetView: string) => {
      const gated = ["settings", "profile", "saved"];
      if (!isAuthenticated && gated.includes(targetView)) {
        onViewChange("login");
      } else {
        onViewChange(targetView);
      }
    },
    [isAuthenticated, onViewChange]
  );

  const { universities, loading: dataLoading, error: dataError, refresh } = useUniversityData();
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      setCurrentHeroBg((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages]);

  const suggestionRef = useRef<HTMLDivElement>(null);

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
    const timeout = setTimeout(() => {
      const q = searchQuery.toLowerCase();
      const filteredUnis = universities.filter(
        (uni) =>
          uni.name.toLowerCase().includes(q) ||
          uni.location.toLowerCase().includes(q) ||
          uni.subjects.some((sub) => sub.toLowerCase().includes(q))
      ).slice(0, 5);
      const filteredArticles = articlesForSearch.filter(
        (art) =>
          art.title.toLowerCase().includes(q) ||
          art.subtitle.toLowerCase().includes(q)
      ).slice(0, 3);
      setSuggestions({ universities: filteredUnis, articles: filteredArticles });
    }, 250);
    return () => clearTimeout(timeout);
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
  const countryCount = useMemo(() => new Set(universities.map((u) => u.location)).size, [universities]);

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


      {/* ── Hero: full-bleed imagery with the message on top ── */}
      <section className="relative flex min-h-[560px] w-full items-center overflow-hidden lg:min-h-[640px]">
        {/* Rotating campus imagery (decorative) */}
        <div aria-hidden="true" className="absolute inset-0">
          {heroImages.map((src, idx) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentHeroBg ? 'opacity-100' : 'opacity-0'}`}
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                priority={idx === 0}
              />
            </div>
          ))}
          {/* Navy scrim so the message always reads over any photo */}
          <div className="absolute inset-0 bg-gradient-to-b from-aur-primary/75 via-aur-primary/55 to-aur-primary/80" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-20 mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8"
        >
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Asia University Rankings</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mt-4 mb-6 text-white">
            Asia&apos;s Most Trusted{" "}
            <span className="text-amber-300">University Intelligence</span> Platform
          </h1>
          <p className="text-slate-100/90 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto mb-10">
            Filter institutional indicators, compare global rankings, and explore regional study models
            including medical careers in Central Asia — powered by live audited data.
          </p>

          {/* Search */}
          <div className="relative w-full max-w-2xl mx-auto mb-4" ref={suggestionRef}>
            <form onSubmit={handleSearchSubmit} className="flex rounded-full overflow-hidden border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-[#0514b5] focus-within:border-transparent transition-all">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ref-muted)]" />
                <Input
                  type="search"
                  role="combobox"
                  aria-expanded={showSuggestions && searchQuery.trim().length > 0}
                  aria-controls="home-search-listbox"
                  aria-autocomplete="list"
                  aria-activedescendant={activeSuggestionIndex >= 0 ? `home-suggestion-${activeSuggestionIndex}` : undefined}
                  aria-label="Search universities, locations, subjects"
                  placeholder="Search universities, locations, subjects..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleSearchKeyDown}
                  className="h-auto w-full rounded-none border-0 bg-white text-sm text-slate-900 pl-11 pr-4 py-3.5 focus-visible:ring-0"
                />
              </div>
              <Button type="submit" className="h-auto rounded-none border-0 bg-aur-primary hover:bg-slate-800 text-white font-semibold px-8 py-3.5 text-sm transition-colors whitespace-nowrap active:translate-y-0!">
                Search
              </Button>
            </form>

            {showSuggestions && searchQuery.trim().length > 0 && (
              <div id="home-search-listbox" role="listbox" aria-label="Search suggestions" className="absolute left-0 right-0 z-30 mt-1 ref-card max-h-80 overflow-y-auto">
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
                                    role="option"
                                    id={`home-suggestion-${rowIndex}`}
                                    aria-selected={active}
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
                          const active = activeSuggestionIndex === rowIndex;
                          return (
                            <button
                              key={art.id}
                              type="button"
                              role="option"
                              id={`home-suggestion-${rowIndex}`}
                              aria-selected={active}
                              onClick={() => activateSuggestion({ kind: "article", article: art })}
                              className={`w-full text-left p-2 text-xs rounded-none block ${active ? "bg-amber-50" : "hover:bg-slate-50"}`}
                            >
                              {highlightMatch(art.title, searchQuery)}
                            </button>
                          );
                        })}
                      </div>
                      <div className="p-2 text-center">
                        <button
                          type="button"
                          role="option"
                          id={`home-suggestion-${rowIndex + 1}`}
                          aria-selected={activeSuggestionIndex === rowIndex + 1}
                          onClick={() => activateSuggestion({ kind: "view-all" })}
                          className={`text-[11px] text-blue-600 font-semibold uppercase tracking-wider ${activeSuggestionIndex === rowIndex + 1 ? "bg-amber-50" : ""}`}
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

          <div className="mt-4 flex flex-wrap gap-2 items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">Trending:</span>
            {["Uzbekistan", "Medicine", "National Univ Singapore", "English medium"].map((tag) => (
              <Badge key={tag} asChild variant="outline" className="h-auto gap-0 font-normal text-[10px] px-2.5 py-1 rounded-full border-white/40 bg-white/95 text-slate-600 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 transition-colors">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag);
                    onSearchSubmit(tag);
                    handleProtectedViewChange("rankings");
                  }}
                >
                  {tag}
                </button>
              </Badge>
            ))}
          </div>

          {/* Dataset facts — the trust strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-t border-white/20 pt-6">
            {[
              [dataLoading ? "—" : universities.length.toLocaleString(), "Universities ranked"],
              [dataLoading ? "—" : String(countryCount), "Countries & territories"],
              ["11", "Weighted indicators"],
            ].map(([value, label]) => (
              <div key={label} className="text-center">
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-200/80 mt-0.5">{label}</div>
              </div>
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
          <Button type="button" className="ref-btn-primary h-auto text-[11px] active:translate-y-0!" onClick={() => handleProtectedViewChange("rankings")}>
            Analyze All Universities
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {dataError && (
          <Alert role="status" className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <span>{dataError}</span>
            <Button
              type="button"
              variant="link"
              onClick={refresh}
              className="h-auto p-0 gap-0 text-xs text-amber-800 font-bold underline underline-offset-2 hover:text-amber-950 hover:underline active:translate-y-0!"
            >
              Retry
            </Button>
          </Alert>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={idx} className="px-5 py-3 border-b border-slate-100 md:odd:border-r">
                  <Skeleton className="h-10 rounded-lg bg-slate-100" aria-hidden />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 md:[&>*:nth-child(odd)]:border-r md:[&>*:nth-child(odd)]:border-slate-100">
              {topTen.map((uni, idx) => {
                const change = uni.rankChange ?? null;
                return (
                  <button
                    key={uni.id}
                    type="button"
                    onClick={() => onUniversitySelect(uni.id)}
                    className="group flex w-full items-center gap-4 border-b border-slate-100 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 md:[&:nth-last-child(-n+2)]:border-b-0"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        idx < 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-aur-primary">
                        {uni.name}
                      </span>
                      <span className="block text-xs text-slate-500">{uni.location}</span>
                    </span>
                    <span className="w-16 shrink-0 text-right">
                      <span className="block font-mono text-sm font-bold text-slate-700">{uni.overall.toFixed(1)}</span>
                      <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-full rounded-full bg-aur-primary/70"
                          style={{ width: `${Math.min(100, Math.max(0, uni.overall))}%` }}
                          aria-hidden
                        />
                      </span>
                    </span>
                    <span className="w-9 shrink-0 text-right">
                      {change === null ? (
                        <span className="text-xs font-semibold text-slate-300" title="No prior-year rank available">
                          <span aria-hidden>—</span>
                          <span className="sr-only">No prior-year rank available</span>
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${change > 0 ? "text-emerald-600" : change < 0 ? "text-rose-500" : "text-slate-500"}`}>
                          {change > 0 && <TrendingUp className="h-3 w-3" aria-hidden />}
                          {change < 0 && <TrendingDown className="h-3 w-3" aria-hidden />}
                          <span aria-hidden>{change === 0 ? "0" : Math.abs(change)}</span>
                          <span className="sr-only">
                            {change === 0 ? "No change since last year" : change > 0 ? `Up ${change} places since last year` : `Down ${Math.abs(change)} places since last year`}
                          </span>
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <p className="text-[10px] text-[var(--ref-muted)] mt-3">* Filterable by location, program &amp; tuition in Rankings Engine.</p>
      </RevealSection>

      {/* ── Feature showcase: flagship + supporting tools ── */}
      <RevealSection className="ref-section pt-0">
        <span className="ref-label">Platform</span>
        <h2 className="text-2xl font-bold mt-1 mb-6">What you can do here</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:items-stretch">

          {/* Flagship: Rankings Engine with a live top-3 preview */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-aur-primary p-7 md:p-9 text-white flex flex-col">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
              Open to everyone — no account needed
            </span>
            <h3 className="text-xl md:text-2xl font-bold mt-2">Rankings Engine</h3>
            <p className="text-sm text-slate-300 max-w-md mt-1.5 mb-6">
              Browse and filter {dataLoading ? "every" : `all ${universities.length.toLocaleString()}`} ranked
              universities by country, program, tuition and score.
            </p>

            <div className="space-y-2 mb-7" aria-label="Current top three universities">
              {dataLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-11 rounded-lg bg-white/10" aria-hidden />
                  ))
                : topTen.slice(0, 3).map((uni, i) => (
                    <div
                      key={uni.id}
                      className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2.5 text-sm backdrop-blur-sm"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/90 font-mono text-[11px] font-bold text-aur-primary">
                        {i + 1}
                      </span>
                      <span className="truncate font-semibold">{uni.name}</span>
                      <span className="ml-auto shrink-0 font-mono text-xs text-slate-300">{uni.overall.toFixed(1)}</span>
                    </div>
                  ))}
            </div>

            <Button
              type="button"
              onClick={() => onViewChange("rankings")}
              className="mt-auto self-start h-auto border-0 bg-white hover:bg-slate-100 text-aur-primary font-bold rounded-lg px-6 py-3 text-sm active:translate-y-0!"
            >
              Explore the full rankings
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>

          {/* Supporting tools */}
          <div className="flex flex-col gap-4">
            {[
              {
                icon: Scale,
                title: "Compare Institutions",
                description: "Up to four universities side by side, across every indicator.",
                view: "saved",
              },
              {
                icon: BarChart3,
                title: "Regional Analytics",
                description: "Country dashboards, score distributions and movement.",
                view: "analytics",
              },
              {
                icon: Bot,
                title: "AI Assistant",
                description: "Ask about programs, tuition or admissions in plain language.",
                view: "home",
              },
            ].map((tool) => (
              <button
                key={tool.title}
                type="button"
                onClick={() => handleProtectedViewChange(tool.view)}
                className="group flex flex-1 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-amber-400/70 hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-aur-primary/10 text-aur-primary transition-colors group-hover:bg-aur-primary group-hover:text-white">
                  <tool.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-800">{tool.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{tool.description}</span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-aur-primary"
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ── Explore by Country (light cards, per-country theme) ── */}
      <RevealSection className="ref-section pt-0 ref-country-section">
        <span className="ref-label">Regional Intelligence</span>
        <h2 className="text-2xl font-bold mt-1 mb-6">Explore by Country</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {countryStats.map((c) => {
            const theme = getCountryTheme(c.country);
            const hasPhoto = Boolean(theme.image);
            return (
              <button
                key={c.country}
                type="button"
                onClick={() => {
                  onSearchSubmit(c.country);
                  onViewChange("rankings");
                }}
                className="group relative h-44 overflow-hidden rounded-xl border border-slate-200 text-left transition-shadow hover:shadow-md"
              >
                {hasPhoto ? (
                  <>
                    <Image
                      src={theme.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ objectPosition: theme.imagePos ?? "center" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-aur-primary/90 via-aur-primary/35 to-transparent" aria-hidden />
                  </>
                ) : (
                  <div className="absolute inset-0" style={{ background: theme.bg }} aria-hidden />
                )}
                <span
                  className={`absolute top-3 right-3 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${
                    hasPhoto ? "bg-white/25 text-white" : "bg-white/80 text-slate-500"
                  }`}
                >
                  {theme.code}
                </span>
                <span className={`absolute inset-x-0 bottom-0 p-4 ${hasPhoto ? "text-white" : "text-aur-primary"}`}>
                  <span className="block text-base font-bold leading-tight">{c.country}</span>
                  <span className={`mt-0.5 block text-xs ${hasPhoto ? "text-slate-200" : "text-slate-500"}`}>
                    {c.count} universities · Avg {c.avgScore.toFixed(1)}
                  </span>
                  <span className={`mt-0.5 block truncate text-[11px] ${hasPhoto ? "text-slate-300" : "text-slate-400"}`}>
                    Top: {c.topUni.name}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </RevealSection>

      {/* ── How we rank (trust block) ── */}
      <RevealSection className="ref-section pt-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="ref-label">Methodology</span>
            <h2 className="text-2xl font-bold mt-1 mb-4">How we rank</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-lg">
              Every score is a weighted blend of eleven indicators, from academic and employer
              reputation surveys to research impact and international outlook. The same
              methodology is applied to every institution in the dataset — no paid placement,
              no editorial overrides.
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <div className="text-2xl font-bold text-aur-primary">{dataLoading ? "—" : universities.length.toLocaleString()}</div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mt-0.5">Universities ranked</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-aur-primary">{dataLoading ? "—" : countryCount}</div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mt-0.5">Countries &amp; territories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-aur-primary">11</div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mt-0.5">Weighted indicators</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {METHODOLOGY_WEIGHTS.map((w) => (
              <div key={w.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">{w.label}</span>
                  <span className="font-mono text-slate-500">{w.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-aur-primary/80"
                    style={{ width: `${w.pct}%` }}
                    aria-hidden
                  />
                </div>
              </div>
            ))}
            <p className="text-[10px] text-slate-400 pt-1">Methodology version QS-Asia-2026 · full breakdown applied uniformly across all institutions.</p>
          </div>
        </div>
        </div>
      </RevealSection>

      {/* ── Audience split ── */}
      <RevealSection className="ref-section pt-0">
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-slate-200">
          <div className="flex flex-col p-7 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-aur-primary/10">
                <Users className="h-5 w-5 text-aur-primary" aria-hidden />
              </span>
              <h3 className="text-lg font-bold text-slate-800">I&apos;m choosing a university</h3>
            </div>
            <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-500">
              Filter by country, program and tuition, read full institution profiles, and
              shortlist the ones that fit — comparisons and saved lists come free with an account.
            </p>
            <Button
              type="button"
              onClick={() => onViewChange("rankings")}
              className="h-auto self-start border-0 bg-aur-primary hover:bg-aur-primary/90 text-white font-bold rounded-lg px-6 py-3 text-sm active:translate-y-0!"
            >
              Browse the rankings
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
          <div className="flex flex-col p-7 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Building2 className="h-5 w-5 text-amber-700" aria-hidden />
              </span>
              <h3 className="text-lg font-bold text-slate-800">I represent an institution</h3>
            </div>
            <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-500">
              Claim and verify your university&apos;s profile, submit data corrections, and take
              part in AUR events and awards through an institutional account.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => onViewChange("login")}
              className="h-auto self-start border-slate-300 text-aur-primary font-bold rounded-lg px-6 py-3 text-sm hover:bg-slate-50 active:translate-y-0!"
            >
              Register your institution
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </RevealSection>

      {/* ── News Flash + newsletter capture ── */}
      <RevealSection className="ref-section pt-0">
        <NewsFlashWidget />

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-sm font-bold text-aur-primary">Get the rankings update</p>
            <p className="text-xs text-slate-500 mt-0.5">Ranking movements and admissions insights, straight to your inbox. No spam.</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto items-center gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address for newsletter"
              required
              className="h-auto w-full sm:w-64 rounded-full border-slate-300 bg-slate-50 px-4 py-2.5 text-sm"
            />
            <Button
              type="submit"
              disabled={loading}
              className="h-auto border-0 bg-aur-primary hover:bg-aur-primary/90 text-white font-bold text-xs px-6 py-2.5 rounded-full transition-colors disabled:opacity-50 whitespace-nowrap active:translate-y-0!"
            >
              {loading ? "..." : "Subscribe"}
            </Button>
          </form>
        </div>
      </RevealSection>

      {/* ── FAQ ── */}
      <RevealSection className="ref-section pt-0">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr] lg:gap-14">
          <div>
            <span className="ref-label">FAQ</span>
            <h2 className="text-2xl font-bold mt-1 mb-3">Common questions</h2>
            <p className="text-sm leading-relaxed text-slate-500 max-w-sm">
              Everything about how the rankings work and what an account adds. Still curious?
              The assistant in the corner answers in plain language.
            </p>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
        {/* FAQ structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: { "@type": "Answer", text: faq.a },
              })),
            }),
          }}
        />
      </RevealSection>

      {/* ── CTA Banner ── */}
      <RevealSection className="ref-section pt-0 pb-8">
        <div className="ref-cta-banner p-8 md:p-12">
          <div className="relative z-10 max-w-xl">
            {isAuthenticated ? (
              <>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">
                  Discover the Future of Higher Education Intelligence
                </h2>
                <p className="text-sm text-slate-300 mb-6">
                  Access live rankings, institutional analytics, and regional insights trusted across Asia.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button type="button" className="h-auto border-0 bg-white hover:bg-slate-100 text-aur-primary font-bold rounded-lg px-8 py-3.5 text-sm transition-colors active:translate-y-0!" onClick={() => handleProtectedViewChange("rankings")}>
                    Explore Rankings
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">
                  Create your free AUR account
                </h2>
                <p className="text-sm text-slate-300 mb-6">
                  Save universities to a shortlist, compare up to four side by side, and pick up
                  your research exactly where you left off — free, in under a minute.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button type="button" className="h-auto border-0 bg-white hover:bg-slate-100 text-aur-primary font-bold rounded-lg px-8 py-3.5 text-sm transition-colors active:translate-y-0!" onClick={() => onViewChange("login")}>
                    Sign up free
                  </Button>
                  <Button type="button" className="h-auto bg-transparent hover:bg-white/10 border-2 border-white text-white font-bold rounded-lg px-8 py-3.5 text-sm transition-colors active:translate-y-0!" onClick={() => onViewChange("rankings")}>
                    Keep exploring rankings
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </RevealSection>

      {/* ── Footer block ── */}
      <footer className="w-full bg-white text-aur-primary pt-12 pb-8 px-6 lg:px-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-4">
              <Image
                src="/logo.png"
                alt="Asia University Rankings Logo"
                width={140}
                height={62}
                style={{ objectFit: "contain", height: "auto" }}
              />
              <p className="mt-4 max-w-xs text-sm text-aur-primary/70 leading-relaxed">
                The independent intelligence platform for higher education across Asia and Central Asia.
              </p>
              <div className="mt-4 flex items-center gap-3">
                {socialLinks.filter(s => s.label !== "Twitter" && s.label !== "YouTube").map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
                  >
                    <Image src={social.imgSrc} alt="" width={16} height={16} className="object-contain" />
                  </a>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div className="md:col-span-2 md:col-start-6">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#152a5e] mb-4">Platform</h4>
              <ul className="space-y-2.5">
                {[
                  ["Rankings Engine", "rankings"],
                  ["Discovery Hub", "home"],
                  ["Analytics", "analytics"],
                  ["Compare Institutions", "saved"],
                ].map(([label, view]) => (
                  <li key={label}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleProtectedViewChange(view)}
                      className="h-auto p-0 gap-2 w-full rounded-none border-0 font-normal whitespace-normal text-sm text-left justify-start text-aur-primary/70 hover:text-aur-primary hover:bg-transparent hover:translate-x-1 transition-all active:translate-y-0!"
                    >
                      {label}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#152a5e] mb-4">Resources</h4>
              <ul className="space-y-2.5">
                {[
                  ["Insights", "/insights"],
                  ["News & Updates", "/news"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-left justify-start text-aur-primary/70 hover:text-aur-primary hover:translate-x-1 transition-all flex items-center gap-2 w-full"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="md:col-span-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#152a5e] mb-4">Newsletter</h4>
              <p className="text-sm text-aur-primary/70 mb-3">Ranking movements and admissions insights, monthly.</p>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aur-primary/50" aria-hidden />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    aria-label="Email address for newsletter"
                    required
                    className="h-auto w-full rounded-lg border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-aur-primary placeholder:text-aur-primary/40"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-auto self-start border-0 bg-aur-primary hover:bg-aur-primary/90 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap active:translate-y-0!"
                >
                  {loading ? "Subscribing..." : "Subscribe"}
                </Button>
              </form>
              {status && (
                <div className="mt-2 text-xs" role="status" aria-live="polite">
                  <span className={status.includes("Thank") ? "text-emerald-600" : "text-amber-600"}>
                    {status}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <span className="text-xs text-aur-primary/60">© 2026 Asia University Rankings. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
