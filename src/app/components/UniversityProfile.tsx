"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  ArrowLeft, MapPin, Globe, BookOpen, GraduationCap, Building2,
  ChevronRight, Award, LineChart, Trophy, ExternalLink, Bookmark,
  Square, Users, CalendarDays, Percent, BadgeCheck, BookMarked, X
} from "lucide-react";

import { useUniversityData } from "./data/UniversityDataProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Lazy load the heavy charting component
const TrendChart = dynamic(() => import("./TrendChart"), {
  loading: () => (
    <div className="w-full h-[300px] flex items-center justify-center border border-[var(--aur-border)] bg-[var(--aur-surface-2)] text-[var(--aur-text-muted)] font-mono text-xs uppercase tracking-widest rounded-xl">
      Loading Analytics Engine...
    </div>
  ),
  ssr: false,
});

interface UniversityProfileProps {
  universityId: string;
  onBack: () => void;
  onViewChange: (view: string) => void;
  savedUniIds: string[];
  onToggleSave: (id: string) => void;
}

export default function UniversityProfile({ universityId, onBack, onViewChange, savedUniIds, onToggleSave }: UniversityProfileProps) {
  const { universities } = useUniversityData();
  const [activeTab, setActiveTab] = useState<"overview" | "metrics" | "admissions">("overview");
  const [campusImageFailed, setCampusImageFailed] = useState(false);
  const [logoImageFailed, setLogoImageFailed] = useState(false);
  
  // Eligibility State

  const uni = universities.find((u) => u.id === universityId);
  const isShortlisted = savedUniIds?.includes(universityId) || false;

  useEffect(() => {
    setCampusImageFailed(false);
    setLogoImageFailed(false);
  }, [universityId]);

  if (!uni) {
    return (
      <div className="mx-auto w-full px-4 py-16 text-center font-sans">
        <h2 className="text-2xl font-bold text-[var(--aur-text)]">University Record Not Found</h2>
        <button onClick={onBack} className="mt-4 text-[var(--aur-text-secondary)] hover:text-[var(--aur-text)] font-bold">Return to Rankings</button>
      </div>
    );
  }

  const primaryRank =
    uni.history.find((rank) => Number.isFinite(rank) && rank > 0) ?? null;
  const programmeCount = uni.programs.length || uni.subjects.length;
  const institutionInitials = uni.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto w-full pb-16 font-sans flex-grow animate-fadeIn bg-[var(--background)]">
      
      {/* Top Navigation */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between border-b border-[var(--aur-border)] bg-[var(--aur-surface)]/80 backdrop-blur-md sticky top-0 z-40">
        <Button
          onClick={onBack}
          className="h-auto gap-0 text-[10px] font-bold uppercase tracking-wider text-[var(--aur-text-secondary)] hover:text-[var(--aur-text)] transition-colors bg-[var(--aur-surface-hover)] hover:bg-[var(--aur-surface-hover)] border-[var(--aur-border)] px-4 py-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Directory
        </Button>
        
        <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--aur-text-muted)]">
          Institutional Profile
        </span>
      </div>

      {/* Hero Section */}
      <div className="relative mx-auto mt-4 max-w-[1500px] px-4 sm:mt-6 sm:px-6 lg:px-8">
        <section className="relative min-h-[390px] overflow-hidden rounded-3xl bg-[#102a4c] shadow-[0_28px_80px_-38px_rgba(15,42,76,0.7)] sm:min-h-[430px]">
          {uni.campusPhoto && !campusImageFailed && (
            <Image
              src={uni.campusPhoto}
              alt={`${uni.name} campus`}
              fill
              className="object-cover"
              priority
              onError={() => setCampusImageFailed(true)}
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,26,48,0.96)_0%,rgba(8,26,48,0.82)_44%,rgba(8,26,48,0.2)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#081a30]/90 to-transparent" />

          <div className="relative z-10 flex min-h-[390px] flex-col justify-between p-6 sm:min-h-[430px] sm:p-9 lg:p-12">
            <div className="flex items-start justify-between gap-4">
              <p className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
                AUR institutional profile
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => onToggleSave(universityId)}
                  className={`h-auto gap-2 rounded-xl border px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md ${
                    isShortlisted
                      ? "border-amber-400 bg-amber-500 hover:bg-amber-500"
                      : "border-white/25 bg-black/25 hover:bg-black/40"
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${isShortlisted ? "fill-current" : ""}`} />
                  {isShortlisted ? "Saved" : "Save"}
                </Button>
                <Button
                  onClick={() => onViewChange("rankings")}
                  className="h-auto gap-2 rounded-xl border border-white/25 bg-black/25 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md hover:bg-black/40"
                >
                  <Square className="h-4 w-4" />
                  Compare
                </Button>
              </div>
            </div>

            <div className="flex max-w-4xl flex-col gap-5 sm:flex-row sm:items-end">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white p-3 shadow-2xl">
                {uni.logo && !logoImageFailed ? (
                  <Image
                    src={uni.logo}
                    alt={`${uni.name} logo`}
                    width={96}
                    height={96}
                    className="h-full w-full object-contain"
                    onError={() => setLogoImageFailed(true)}
                  />
                ) : (
                  <span className="font-serif text-2xl font-bold tracking-tight text-[#1a365d]">
                    {institutionInitials}
                  </span>
                )}
              </div>
              <div className="min-w-0 pb-1 text-white">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white/75">
                  <MapPin className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>{uni.location}</span>
                </div>
                <h1 className="max-w-3xl text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {uni.name}
                </h1>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-1 overflow-hidden rounded-2xl border border-[var(--aur-border)] bg-[var(--aur-surface)] shadow-[var(--aur-shadow-sm)] sm:grid-cols-3">
          {[
            { label: "AUR rank", value: primaryRank ? `#${primaryRank}` : "Pending" },
            { label: "Overall score", value: Number.isFinite(uni.overall) ? uni.overall.toFixed(1) : "—" },
            { label: "Programmes listed", value: programmeCount || "—" },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`px-6 py-5 ${index > 0 ? "border-t border-[var(--aur-border)] sm:border-l sm:border-t-0" : ""}`}
            >
              <span className="block font-serif text-2xl font-bold text-[var(--aur-text)]">
                {stat.value}
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--aur-text-muted)]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Accessible Tab Navigation */}
        <div className="border-b border-[var(--aur-border)] mb-12 flex overflow-x-auto hide-scrollbar gap-8">
          {[
            { id: "overview", label: "Overview & Context", icon: Building2 },
            { id: "metrics", label: "Academic Metrics", icon: LineChart },
            { id: "admissions", label: "Admissions", icon: GraduationCap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center whitespace-nowrap border-b-2 pb-4 text-xs font-bold uppercase tracking-widest transition-all -mb-[1px] ${
                activeTab === tab.id
                  ? "border-[var(--aur-text)] text-[var(--aur-text)]"
                  : "border-transparent text-[var(--aur-text-muted)] hover:text-[var(--aur-text-secondary)] hover:border-[var(--aur-border-strong)]"
              }`}
            >
              <tab.icon className={`h-4 w-4 mr-2.5 ${activeTab === tab.id ? "text-[var(--aur-text)]" : "text-[var(--aur-text-muted)]"}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[400px]">
          
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <h3 className="font-serif text-3xl font-bold text-[var(--aur-text)] mb-6">Institutional Profile</h3>
                <p className="text-[var(--aur-text-secondary)] text-base leading-relaxed mb-10">
                  {uni.description}
                </p>
                
                <h4 className="font-serif text-2xl font-bold text-[var(--aur-text)] mb-6">Regional Context & Infrastructure</h4>
                <p className="text-[var(--aur-text-secondary)] text-base leading-relaxed mb-12">
                  Located in the heart of {uni.location}, this institution benefits from robust regional infrastructure and deep academic networks. 
                  International students frequently choose this destination for its unique blend of cultural heritage and advanced research facilities. 
                  {uni.hasMedicine && " Its medical faculties are internationally recognized, providing rigorous clinical instruction tailored for global medical practice."}
                </p>

                {/* Subject Ranking Highlights */}
                {uni.qsSubjectRankings && uni.qsSubjectRankings.length > 0 && (
                  <div className="mt-12 bg-[var(--aur-surface)] border border-[var(--aur-border)] rounded-3xl p-5 sm:p-8 shadow-[var(--aur-shadow-sm)]">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--aur-border)]">
                      <h4 className="font-serif text-2xl font-bold text-[var(--aur-text)]">Rankings by Subject</h4>
                      <Trophy className="h-6 w-6 text-[var(--aur-text-muted)]" />
                    </div>

                    <div className="space-y-4">
                      {uni.qsSubjectRankings.map((qs, i) => (
                        <div key={i} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5 bg-[var(--aur-surface-2)] border border-[var(--aur-border)] rounded-2xl hover:border-[var(--aur-border-strong)] transition-all group">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-[var(--aur-surface)] border border-[var(--aur-border)] flex items-center justify-center shadow-sm shrink-0">
                              <BookOpen className="h-5 w-5 text-[var(--aur-text-secondary)] group-hover:text-[var(--aur-text)] transition-colors" />
                            </div>
                            <span className="font-bold text-sm text-[var(--aur-text)]">{qs.subject}</span>
                          </div>
                          <div className="flex items-center gap-4 sm:gap-6 shrink-0 pl-14 sm:pl-0">
                            <div className="text-right">
                              <span className="block text-[10px] uppercase tracking-widest text-[var(--aur-text-muted)] font-bold mb-1">World Rank</span>
                              <span className="font-mono text-lg font-bold text-[var(--aur-text)]">#{qs.worldRank}</span>
                            </div>
                            <Separator orientation="vertical" className="h-10 bg-[var(--aur-border)]" />
                            <div className="text-right min-w-[4rem]">
                              <span className="block text-[10px] uppercase tracking-widest text-[var(--aur-text-muted)] font-bold mb-1">Score</span>
                              <span className="font-mono text-lg font-bold text-[var(--aur-text)]">{qs.score.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="border border-[var(--aur-border)] bg-[var(--aur-surface)] rounded-3xl p-5 sm:p-8 sticky top-28 shadow-[var(--aur-shadow)]">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--aur-text-muted)] mb-6 border-b border-[var(--aur-border)] pb-4 flex items-center justify-between">
                    Fast Facts
                    <ExternalLink className="h-4 w-4" />
                  </h4>
                  <ul className="space-y-6">
                    <li>
                      <span className="block text-[10px] text-[var(--aur-text-muted)] uppercase tracking-wider mb-2">Location</span>
                      <span className="text-sm font-bold text-[var(--aur-text)] flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[var(--aur-text-secondary)]" />
                        {uni.location}
                      </span>
                    </li>
                    <li>
                      <span className="block text-[10px] text-[var(--aur-text-muted)] uppercase tracking-wider mb-2">Primary Language</span>
                      <span className="text-sm font-bold text-[var(--aur-text)]">{uni.languages[0]}</span>
                    </li>
                    <li>
                      <span className="block text-[10px] text-[var(--aur-text-muted)] uppercase tracking-wider mb-2">Est. Tuition (Intl)</span>
                      <span className="text-sm font-bold text-[var(--aur-text)] font-mono bg-[var(--aur-surface-2)] px-3 py-1.5 rounded-lg border border-[var(--aur-border)] inline-block">{uni.tuition}</span>
                    </li>
                  </ul>

                  {/* Core Metrics Visual Bar Chart */}
                  <div className="mt-8 border-t border-[var(--aur-border)] pt-6">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-[var(--aur-text-muted)] mb-5">
                      Core Metrics
                    </h5>
                    <div className="space-y-5">
                      {[
                        { label: "Academic Reputation", value: uni.academicReputation || uni.research },
                        { label: "Employer Reputation", value: uni.employerReputation || uni.employability },
                        { label: "Citations per Faculty", value: uni.citations },
                        { label: "Faculty/Student Ratio", value: uni.facultyStudentRatio || uni.teaching },
                      ].map((metric) => (
                        <div key={metric.label}>
                          <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-[var(--aur-text-secondary)]">{metric.label}</span>
                            <span className="font-mono text-[var(--aur-text)]">{metric.value.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-[var(--aur-surface-hover)] rounded-full overflow-hidden border border-[var(--aur-border)]">
                            <div
                              
                              
                              
                              className="h-full bg-[var(--aur-text)] rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === "metrics" && (
            <div className="space-y-12 animate-fadeIn max-w-5xl mx-auto">
              
              <div className="text-center mb-10">
                <h3 className="font-serif text-3xl font-bold text-[var(--aur-text)] mb-4">Academic Intelligence Metrics</h3>
                <p className="text-sm text-[var(--aur-text-secondary)] max-w-2xl mx-auto leading-relaxed">
                  Scores are aggregated from the Global Employer Survey, Academic Reputation Index, and peer-reviewed citation registries to ensure maximum fidelity.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {[
                  { label: "Overall Score", value: uni.overall, highlight: true },
                  { label: "Academic Rep", value: uni.academicReputation || uni.research },
                  { label: "Employer Rep", value: uni.employerReputation || uni.employability },
                  { label: "Citations/Faculty", value: uni.citations },
                  { label: "Faculty/Student", value: uni.facultyStudentRatio || uni.teaching },
                  { label: "Teaching", value: uni.teaching },
                ].map((metric, idx) => (
                  <div key={idx} className={`rounded-3xl p-5 sm:p-8 flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-1 ${
                    metric.highlight
                      ? "bg-[var(--aur-text)] text-[var(--background)]"
                      : "border border-[var(--aur-border)] bg-[var(--aur-surface)]"
                  }`}>
                    <span className={`block text-[10px] uppercase font-bold tracking-widest mb-4 ${
                      metric.highlight ? "text-[var(--background)] opacity-70" : "text-[var(--aur-text-muted)]"
                    }`}>
                      {metric.label}
                    </span>
                    <span className={`text-3xl sm:text-4xl font-black font-serif ${
                      metric.highlight ? "text-[var(--background)]" : "text-[var(--aur-text)]"
                    }`}>
                      {metric.value.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border border-[var(--aur-border)] rounded-3xl bg-[var(--aur-surface)] p-8 sm:p-10 shadow-[var(--aur-shadow-sm)] mt-12">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h4 className="font-serif text-2xl font-bold text-[var(--aur-text)]">5-Year Rank Progression</h4>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--aur-text-muted)] mt-2">Historical Performance Chart</p>
                  </div>
                  <LineChart className="h-6 w-6 text-[var(--aur-text-muted)]" />
                </div>
                {/* Lazy Loaded Chart */}
                <div className="bg-[var(--aur-surface-2)] rounded-2xl border border-[var(--aur-border)] p-6">
                  <TrendChart history={uni.history} />
                </div>
              </div>
            </div>
          )}

          {/* Admissions & Programs Tab */}
          {activeTab === "admissions" && (
            <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">

              {/* ── Key Admission Facts ── only shown when data exists ── */}
              {(uni.acceptanceRate || uni.applicationDeadline || uni.founded || uni.studentCount || uni.scholarshipDetails) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {uni.acceptanceRate !== undefined && (
                    <div className="p-6 rounded-2xl border border-[var(--aur-border)] bg-[var(--aur-surface)] flex flex-col gap-2">
                      <div className="h-9 w-9 rounded-xl bg-[var(--aur-surface-2)] border border-[var(--aur-border)] flex items-center justify-center mb-1">
                        <Percent className="h-4 w-4 text-[var(--aur-text-secondary)]" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--aur-text-muted)]">Acceptance Rate</span>
                      <span className="text-2xl font-black font-mono text-[var(--aur-text)]">{uni.acceptanceRate}%</span>
                    </div>
                  )}
                  {uni.founded !== undefined && (
                    <div className="p-6 rounded-2xl border border-[var(--aur-border)] bg-[var(--aur-surface)] flex flex-col gap-2">
                      <div className="h-9 w-9 rounded-xl bg-[var(--aur-surface-2)] border border-[var(--aur-border)] flex items-center justify-center mb-1">
                        <Award className="h-4 w-4 text-[var(--aur-text-secondary)]" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--aur-text-muted)]">Established</span>
                      <span className="text-2xl font-black font-mono text-[var(--aur-text)]">{uni.founded}</span>
                    </div>
                  )}
                  {uni.studentCount !== undefined && (
                    <div className="p-6 rounded-2xl border border-[var(--aur-border)] bg-[var(--aur-surface)] flex flex-col gap-2">
                      <div className="h-9 w-9 rounded-xl bg-[var(--aur-surface-2)] border border-[var(--aur-border)] flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 text-[var(--aur-text-secondary)]" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--aur-text-muted)]">Students</span>
                      <span className="text-2xl font-black font-mono text-[var(--aur-text)]">{uni.studentCount.toLocaleString()}</span>
                    </div>
                  )}
                  {uni.applicationDeadline && (
                    <div className="p-6 rounded-2xl border border-[var(--aur-border)] bg-[var(--aur-surface)] flex flex-col gap-2">
                      <div className="h-9 w-9 rounded-xl bg-[var(--aur-surface-2)] border border-[var(--aur-border)] flex items-center justify-center mb-1">
                        <CalendarDays className="h-4 w-4 text-[var(--aur-text-secondary)]" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--aur-text-muted)]">Application Deadline</span>
                      <span className="text-sm font-bold text-[var(--aur-text)] leading-tight">{uni.applicationDeadline}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Scholarship Banner ── */}
              {uni.scholarshipDetails && (
                <div className="flex gap-4 p-6 rounded-2xl border border-[var(--aur-border)] bg-[var(--aur-surface-2)]">
                  <div className="h-10 w-10 rounded-xl bg-[var(--aur-surface)] border border-[var(--aur-border)] flex items-center justify-center shrink-0">
                    <BadgeCheck className="h-5 w-5 text-[var(--aur-text)]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--aur-text-muted)] mb-1">Financial Aid & Scholarships</p>
                    <p className="text-sm text-[var(--aur-text-secondary)] leading-relaxed">{uni.scholarshipDetails}</p>
                  </div>
                </div>
              )}

              {/* ── Faculties + Programs ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-[var(--aur-surface-hover)] border border-[var(--aur-border)] flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-[var(--aur-text)]" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-[var(--aur-text)]">Core Faculties</h3>
                  </div>
                  <ul className="divide-y divide-[var(--aur-border)] border border-[var(--aur-border)] rounded-3xl bg-[var(--aur-surface)] overflow-hidden shadow-sm">
                    {uni.subjects.map((sub, idx) => (
                      <li key={idx} className="px-6 py-5 flex items-center text-sm font-bold text-[var(--aur-text)] hover:bg-[var(--aur-surface-hover)] transition-colors">
                        <div className="h-2 w-2 rounded-full bg-[var(--aur-text)] opacity-40 mr-4" />
                        {sub}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-[var(--aur-surface-hover)] border border-[var(--aur-border)] flex items-center justify-center">
                      <BookMarked className="h-5 w-5 text-[var(--aur-text)]" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-[var(--aur-text)]">Featured Programs</h3>
                  </div>
                  <ul className="space-y-3">
                    {uni.programs.map((prog, idx) => (
                      <li
                        key={idx}
                        className="p-5 border border-[var(--aur-border)] bg-[var(--aur-surface)] rounded-2xl flex items-center justify-between group cursor-pointer hover:border-[var(--aur-border-strong)] hover:shadow-[var(--aur-shadow-sm)] transition-all"
                      >
                        <span className="text-sm text-[var(--aur-text)] font-bold">{prog}</span>
                        <span className="text-[10px] text-[var(--aur-text-muted)] uppercase tracking-widest font-bold flex items-center gap-1.5 group-hover:text-[var(--aur-text)] transition-colors shrink-0 ml-4">
                          Details <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* ── Languages of Instruction ── */}
              <div className="p-6 rounded-2xl border border-[var(--aur-border)] bg-[var(--aur-surface)] flex flex-wrap gap-3 items-center">
                <Globe className="h-4 w-4 text-[var(--aur-text-muted)] shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--aur-text-muted)] mr-2">Languages of Instruction</span>
                {uni.languages.map((lang) => (
                  <Badge
                    key={lang}
                    variant="outline"
                    className="h-auto text-xs font-bold px-3 py-1.5 rounded-lg border-[var(--aur-border-strong)] bg-[var(--aur-surface-2)] text-[var(--aur-text)]"
                  >
                    {lang}
                  </Badge>
                ))}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}


