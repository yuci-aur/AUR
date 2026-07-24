"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  ArrowLeft, MapPin, Globe, BookOpen, GraduationCap, Building2,
  ChevronRight, Award, LineChart, Trophy, ExternalLink, Bookmark,
  Square, Users, CalendarDays, Percent, BadgeCheck, BookMarked, X
} from "lucide-react";

import { useUniversityData } from "./data/UniversityDataProvider";

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

  const uni = universities.find((u) => u.id === universityId);
  const isShortlisted = savedUniIds?.includes(universityId) || false;

  if (!uni) {
    return (
      <div className="mx-auto w-full px-4 py-16 text-center font-sans">
        <h2 className="text-2xl font-bold text-[var(--aur-text)]">University Record Not Found</h2>
        <button onClick={onBack} className="mt-4 text-[var(--aur-text-secondary)] hover:text-[var(--aur-text)] font-bold">Return to Rankings</button>
      </div>
    );
  }

  // Current AUR rank = the most recent entry in the 5-year history series.
  const currentRank = uni.history?.[0];
  // Typographic monogram fallback — never show a stretched campus photo as a "logo".
  const monogram = uni.name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const classification = `${typeof uni.isPublic === "boolean" ? (uni.isPublic ? "Public" : "Private") : "Research"} University`;

  // Vitals strip — only cells with real data are rendered, so we never show a
  // hollow "0" or "—" masquerading as a fact.
  const vitals: { label: string; value: string }[] = [
    uni.founded !== undefined && { label: "Founded", value: String(uni.founded) },
    uni.studentCount !== undefined && { label: "Students", value: uni.studentCount.toLocaleString() },
    uni.acceptanceRate !== undefined && { label: "Acceptance", value: `${uni.acceptanceRate}%` },
    { label: uni.subjects.length === 1 ? "Subject area" : "Subject areas", value: String(uni.subjects.length) },
    uni.tuition && { label: "Tuition / yr", value: uni.tuition.replace(/\/\s*year/i, "").trim() },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="mx-auto w-full pb-16 font-sans flex-grow animate-fadeIn bg-[var(--background)]">

      {/* Record bar — reads like the header of a catalogued entry */}
      <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between border-b border-[var(--aur-border)] bg-[var(--aur-surface)]/85 backdrop-blur-md sticky top-0 z-40">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--aur-text-secondary)] hover:text-[var(--aur-text)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Directory
        </button>
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--aur-text-muted)]">
          Institutional Record
        </span>
      </div>

      {/* ── Masthead ── full-bleed campus band with a contained identity plate ── */}
      <div className="relative w-full min-h-[340px] md:min-h-[400px] flex items-center overflow-hidden bg-[var(--aur-text)]">
        {uni.campusPhoto && (
          <Image
            src={uni.campusPhoto}
            alt={`${uni.name} campus`}
            fill
            className="object-cover"
            priority
          />
        )}
        {/* Directional scrim: dark at the left where the plate sits, clearing to the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/95 via-[#0a1628]/70 to-[#0a1628]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/80 via-transparent to-transparent" />

        <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-20">
          <div className="flex items-start gap-5 sm:gap-8">

            {/* Rank — the signature: an oversized editorial numeral with a crimson rule */}
            {currentRank !== undefined && (
              <div className="hidden sm:flex shrink-0 items-stretch gap-5">
                <div className="flex flex-col justify-center text-right">
                  <span className="aur-serif text-5xl md:text-7xl font-bold leading-none text-white tabular-nums">
                    {currentRank}
                  </span>
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
                    AUR Rank
                  </span>
                </div>
                <div className="w-px self-stretch bg-[var(--aur-accent)]" />
              </div>
            )}

            {/* Identity */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-4 sm:gap-5">
                {/* Logo or typographic monogram — never a stretched photo */}
                <div className="shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-white/95 border border-white/40 shadow-lg overflow-hidden flex items-center justify-center">
                  {uni.logo ? (
                    <Image
                      src={uni.logo}
                      alt={`${uni.name} logo`}
                      width={80}
                      height={80}
                      className="object-contain w-full h-full p-2"
                    />
                  ) : (
                    <span className="aur-serif text-xl sm:text-2xl font-bold text-[var(--aur-text)]">
                      {monogram}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="aur-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.05] break-words">
                    {uni.name}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-white/75">
                    {/* Rank inline on mobile, where the large numeral is hidden */}
                    {currentRank !== undefined && (
                      <>
                        <span className="sm:hidden inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                          <span className="text-[var(--aur-accent-muted)]">AUR</span> No. {currentRank}
                        </span>
                        <span className="sm:hidden h-1 w-1 rounded-full bg-white/40" />
                      </>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {uni.location}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/40" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
                      {classification}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap gap-2.5">
                    <button
                      onClick={() => onToggleSave(universityId)}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.12em] transition-all ${
                        isShortlisted
                          ? "bg-[var(--aur-accent)] text-white shadow-lg"
                          : "bg-white/10 text-white border border-white/25 hover:bg-white/20 backdrop-blur-sm"
                      }`}
                    >
                      <Bookmark className={`h-4 w-4 ${isShortlisted ? "fill-current" : ""}`} />
                      {isShortlisted ? "Saved" : "Save"}
                    </button>
                    <button
                      onClick={() => onViewChange("saved")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.12em] bg-white/10 text-white border border-white/25 hover:bg-white/20 backdrop-blur-sm transition-all"
                    >
                      <Square className="h-4 w-4" /> Compare
                    </button>
                    {uni.website && (
                      <a
                        href={uni.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.12em] bg-white text-[var(--aur-text)] hover:bg-white/90 transition-all"
                      >
                        Visit site <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Vitals strip ── hairline-divided data cells, only where data exists ── */}
      <div className="border-b border-[var(--aur-border)] bg-[var(--aur-surface)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-[var(--aur-border)]">
            {vitals.map((v) => (
              <div key={v.label} className="px-5 py-5 sm:py-6">
                <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--aur-text-muted)]">
                  {v.label}
                </dt>
                <dd className="mt-1.5 aur-serif text-2xl sm:text-3xl font-bold text-[var(--aur-text)] tabular-nums">
                  {v.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Section Navigation */}
        <div
          className="border-b border-[var(--aur-border)] mb-12 flex overflow-x-auto gap-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {[
            { id: "overview", label: "Overview", icon: Building2 },
            { id: "metrics", label: "Metrics", icon: LineChart },
            { id: "admissions", label: "Admissions", icon: GraduationCap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group relative inline-flex items-center gap-2.5 whitespace-nowrap px-4 pb-4 pt-1 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors -mb-px ${
                activeTab === tab.id
                  ? "text-[var(--aur-text)]"
                  : "text-[var(--aur-text-muted)] hover:text-[var(--aur-text-secondary)]"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span
                className={`absolute inset-x-0 -bottom-px h-0.5 transition-colors ${
                  activeTab === tab.id ? "bg-[var(--aur-accent)]" : "bg-transparent group-hover:bg-[var(--aur-border-strong)]"
                }`}
              />
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
                  <div className="mt-12 bg-[var(--aur-surface)] border border-[var(--aur-border)] rounded-3xl p-8 shadow-[var(--aur-shadow-sm)]">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--aur-border)]">
                      <h4 className="font-serif text-2xl font-bold text-[var(--aur-text)]">Rankings by Subject</h4>
                      <Trophy className="h-6 w-6 text-[var(--aur-text-muted)]" />
                    </div>
                    
                    <div className="space-y-4">
                      {uni.qsSubjectRankings.map((qs, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-[var(--aur-surface-2)] border border-[var(--aur-border)] rounded-2xl hover:border-[var(--aur-border-strong)] transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-[var(--aur-surface)] border border-[var(--aur-border)] flex items-center justify-center shadow-sm">
                              <BookOpen className="h-5 w-5 text-[var(--aur-text-secondary)] group-hover:text-[var(--aur-text)] transition-colors" />
                            </div>
                            <span className="font-bold text-sm text-[var(--aur-text)]">{qs.subject}</span>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <span className="block text-[10px] uppercase tracking-widest text-[var(--aur-text-muted)] font-bold mb-1">World Rank</span>
                              <span className="font-mono text-lg font-bold text-[var(--aur-text)]">#{qs.worldRank}</span>
                            </div>
                            <div className="w-px h-10 bg-[var(--aur-border)]"></div>
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
                <div className="border border-[var(--aur-border)] bg-[var(--aur-surface)] rounded-3xl p-8 sticky top-28 shadow-[var(--aur-shadow)]">
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
                        { label: "International Students", value: uni.intlStudents }
                      ].map((metric) => (
                        <div key={metric.label}>
                          <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-[var(--aur-text-secondary)]">{metric.label}</span>
                            <span className="font-mono text-[var(--aur-text)]">{metric.value.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-[var(--aur-surface-hover)] rounded-full overflow-hidden border border-[var(--aur-border)]">
                            <div
                              style={{ width: `${Math.max(0, Math.min(100, metric.value))}%` }}
                              className="h-full bg-[var(--aur-text)] rounded-full transition-[width] duration-700 ease-out"
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

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: "Overall Score", value: uni.overall, highlight: true },
                  { label: "Academic Rep", value: uni.academicReputation || uni.research },
                  { label: "Employer Rep", value: uni.employerReputation || uni.employability },
                  { label: "Citations/Faculty", value: uni.citations },
                  { label: "Faculty/Student", value: uni.facultyStudentRatio || uni.teaching },
                  { label: "Intl Students", value: uni.intlStudents },
                ].map((metric, idx) => (
                  <div key={idx} className={`rounded-3xl p-8 flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-1 ${
                    metric.highlight 
                      ? "bg-[var(--aur-text)] text-[var(--background)]" 
                      : "border border-[var(--aur-border)] bg-[var(--aur-surface)]"
                  }`}>
                    <span className={`block text-[10px] uppercase font-bold tracking-widest mb-4 ${
                      metric.highlight ? "text-[var(--background)] opacity-70" : "text-[var(--aur-text-muted)]"
                    }`}>
                      {metric.label}
                    </span>
                    <span className={`text-4xl font-black font-serif ${
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

              {/* ── Official Admissions ── */}
              <div className="bg-[var(--aur-surface)] border border-[var(--aur-border)] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[var(--aur-shadow-sm)]">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="bg-[var(--aur-surface-2)] border border-[var(--aur-border)] p-3 rounded-xl text-[var(--aur-text)]">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-serif text-[var(--aur-text)] leading-tight">Admissions &amp; Requirements</h3>
                      <p className="text-xs text-[var(--aur-text-muted)] mt-1 font-medium tracking-wide">Entry requirements, deadlines, and how to apply are published by {uni.name}.</p>
                    </div>
                  </div>

                  {uni.website ? (
                    <a
                      href={uni.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[var(--aur-text)] text-[var(--background)] hover:opacity-80 font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all shadow-md shrink-0 w-full md:w-auto text-center inline-flex items-center justify-center gap-2"
                    >
                      Visit Admissions Site <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--aur-text-muted)] bg-[var(--aur-surface-2)] border border-[var(--aur-border)] py-3 px-6 rounded-xl shrink-0 w-full md:w-auto text-center">
                      Website unavailable
                    </span>
                  )}
                </div>
              </div>

              {/* ── Languages of Instruction ── */}
              <div className="p-6 rounded-2xl border border-[var(--aur-border)] bg-[var(--aur-surface)] flex flex-wrap gap-3 items-center">
                <Globe className="h-4 w-4 text-[var(--aur-text-muted)] shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--aur-text-muted)] mr-2">Languages of Instruction</span>
                {uni.languages.map((lang) => (
                  <span
                    key={lang}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--aur-border-strong)] bg-[var(--aur-surface-2)] text-[var(--aur-text)]"
                  >
                    {lang}
                  </span>
                ))}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}


