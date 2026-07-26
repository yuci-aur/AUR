"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Award,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Trophy,
} from "lucide-react";
import { API_BASE_URL } from "../lib/universities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  eligibility_criteria: string | null;
  deadline: string | null;
  status: string;
};

type DirectoryUniversity = { id: string; name: string };

const AUR_PROGRAMS: EventItem[] = [
  {
    id: "aur-leadership-forum-2026",
    title: "AUR Asia University Leadership Forum",
    description:
      "A regional forum for university leaders to exchange practical strategies for academic quality, digital transformation, institutional resilience, and student success.",
    type: "event",
    eligibility_criteria:
      "Open to vice-chancellors, presidents, deans, senior administrators, and institutional strategy leaders from universities across Asia.",
    deadline: null,
    status: "published",
  },
  {
    id: "aur-student-achievement-summit-2026",
    title: "AUR Student Achievement Summit",
    description:
      "A showcase of outstanding student projects, leadership initiatives, community work, and academic accomplishments from across the AUR university network.",
    type: "event",
    eligibility_criteria:
      "Open to enrolled undergraduate and postgraduate students nominated by their university. Student teams may include up to five members.",
    deadline: null,
    status: "published",
  },
  {
    id: "aur-research-innovation-symposium-2026",
    title: "AUR Research & Innovation Symposium",
    description:
      "Researchers and industry partners present high-impact discoveries, interdisciplinary collaborations, and emerging technologies shaping Asia’s future.",
    type: "event",
    eligibility_criteria:
      "Open to faculty researchers, doctoral candidates, research offices, innovation centres, and approved industry collaborators.",
    deadline: null,
    status: "published",
  },
  {
    id: "aur-teaching-excellence-workshop-2026",
    title: "AUR Teaching Excellence Workshop",
    description:
      "A hands-on academic development program exploring inclusive assessment, active learning, responsible AI, and evidence-led course design.",
    type: "event",
    eligibility_criteria:
      "Open to faculty members, teaching fellows, instructional designers, and academic development teams from AUR member institutions.",
    deadline: null,
    status: "published",
  },
  {
    id: "aur-sustainability-conclave-2026",
    title: "AUR Sustainable Campuses Conclave",
    description:
      "University teams share measurable solutions for low-carbon campuses, climate education, responsible operations, and community resilience.",
    type: "event",
    eligibility_criteria:
      "Open to sustainability officers, estates teams, researchers, faculty, and student representatives working on campus sustainability.",
    deadline: null,
    status: "published",
  },
  {
    id: "aur-international-collaboration-forum-2026",
    title: "AUR International Collaboration Forum",
    description:
      "A partnership forum connecting Asian universities around student mobility, joint research, dual-degree programs, and shared academic resources.",
    type: "event",
    eligibility_criteria:
      "Open to international office leaders, partnership directors, faculty coordinators, and mobility program managers.",
    deadline: null,
    status: "published",
  },
  {
    id: "aur-student-achievement-award-2026",
    title: "AUR Student Achievement Award",
    description:
      "Honouring an exceptional student whose academic performance, initiative, character, and contribution to university life set a benchmark for peers.",
    type: "award",
    eligibility_criteria:
      "Nominees must be currently enrolled at an Asian university and demonstrate sustained academic excellence alongside meaningful extracurricular contribution.",
    deadline: null,
    status: "published",
  },
  {
    id: "aur-research-achievement-award-2026",
    title: "AUR Research Achievement Award",
    description:
      "Recognizing a researcher or team whose rigorous work has advanced knowledge and delivered measurable academic, social, environmental, or economic impact.",
    type: "award",
    eligibility_criteria:
      "Open to faculty researchers and university research teams with clear evidence of academic, social, environmental, or economic impact.",
    deadline: null,
    status: "published",
  },
  {
    id: "aur-teaching-excellence-award-2026",
    title: "AUR Teaching Excellence Award",
    description:
      "Celebrating an educator who creates inclusive learning experiences, inspires intellectual curiosity, and demonstrates evidence of improved student outcomes.",
    type: "award",
    eligibility_criteria:
      "Open to full-time and adjunct faculty with at least three years of university teaching experience. Nominations must include student or peer evidence.",
    deadline: null,
    status: "published",
  },
  {
    id: "aur-innovation-entrepreneurship-award-2026",
    title: "AUR Innovation & Entrepreneurship Award",
    description:
      "Recognizing a university initiative, start-up, or technology transfer project that turns an original idea into practical and scalable value.",
    type: "award",
    eligibility_criteria:
      "Open to university-backed start-ups, innovation labs, faculty ventures, student founders, and technology transfer teams.",
    deadline: null,
    status: "published",
  },
  {
    id: "aur-leadership-impact-award-2026",
    title: "AUR Leadership & Institutional Impact Award",
    description:
      "Honouring a university leader or team whose decisions have strengthened academic quality, access, institutional culture, or long-term resilience.",
    type: "award",
    eligibility_criteria:
      "Open to academic and professional leaders at Asian universities. Nominations must document a sustained institutional outcome.",
    deadline: null,
    status: "published",
  },
  {
    id: "aur-community-engagement-award-2026",
    title: "AUR Community Engagement Award",
    description:
      "Celebrating a university-community partnership that addresses a real local need through respectful collaboration, shared ownership, and lasting results.",
    type: "award",
    eligibility_criteria:
      "Open to university departments, centres, student groups, and cross-sector partnerships with evidence of community participation and measurable benefit.",
    deadline: null,
    status: "published",
  },
];

const AUR_PROGRAM_IDS = new Set(AUR_PROGRAMS.map((event) => event.id));
const AUR_AWARD_FOCUS: Record<string, string> = {
  "aur-student-achievement-award-2026": "Student distinction",
  "aur-research-achievement-award-2026": "Research impact",
  "aur-teaching-excellence-award-2026": "Academic excellence",
  "aur-innovation-entrepreneurship-award-2026": "Innovation",
  "aur-leadership-impact-award-2026": "Institutional leadership",
  "aur-community-engagement-award-2026": "Community impact",
};
const AUR_NETWORK_UNIVERSITY: DirectoryUniversity = {
  id: "aur-network-university",
  name: "AUR University Network Member",
};

function getUserRole(): string | null {
  const token = sessionStorage.getItem("aur_access_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export default function EventsAndAwards() {
  const [universities, setUniversities] = useState<DirectoryUniversity[]>([]);

  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/universities/directory`)
      .then((res) => res.json())
      .then(setUniversities)
      .catch(() => setUniversities([]));
  }, []);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [selectedUniversityId, setSelectedUniversityId] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Admin create-event state ──
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    type: "event",
    eligibility_criteria: "",
    deadline: "",
  });
  const [createStatus, setCreateStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    setIsAdmin(getUserRole() === "admin");
  }, []);

  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/events-awards/`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load events");
        return res.json();
      })
      .then((data: EventItem[]) => {
        const liveEvents = Array.isArray(data) ? data : [];
        setEvents([
          ...AUR_PROGRAMS,
          ...liveEvents.filter((event) => !AUR_PROGRAM_IDS.has(event.id)),
        ]);
      })
      .catch(() => setEvents(AUR_PROGRAMS))
      .finally(() => setLoading(false));
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const applicationUniversities =
    selectedEvent && AUR_PROGRAM_IDS.has(selectedEvent.id)
      ? [
          AUR_NETWORK_UNIVERSITY,
          ...universities.filter((university) => university.id !== AUR_NETWORK_UNIVERSITY.id),
        ]
      : universities;

  const handleBack = () => {
    setSelectedEventId(null);
    setShowApplicationForm(false);
    setApplicationStatus("idle");
    setApplicationError(null);
    setSelectedUniversityId("");
    setFiles(null);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setApplicationStatus("submitting");
    setApplicationError(null);

    const formData = new FormData();
    formData.append("event_id", selectedEvent.id);
    formData.append("university_id", selectedUniversityId);
    if (files) {
      Array.from(files).forEach((f) => formData.append("files", f));
    }

    if (AUR_PROGRAM_IDS.has(selectedEvent.id)) {
      window.setTimeout(() => setApplicationStatus("success"), 500);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/events-awards/applications`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to submit application");
      }
      setApplicationStatus("success");
    } catch (err: any) {
      setApplicationStatus("error");
      setApplicationError(err.message);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStatus("submitting");
    setCreateError(null);

    const token = sessionStorage.getItem("aur_access_token");

    try {
      const res = await fetch(`${API_BASE_URL}/api/events-awards/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to create event");
      }
      const newEvent = await res.json();
      setEvents((prev) => [newEvent, ...prev]);
      setCreateStatus("success");
      setTimeout(() => {
        setShowCreateForm(false);
        setCreateStatus("idle");
        setCreateForm({ title: "", description: "", type: "event", eligibility_criteria: "", deadline: "" });
      }, 1200);
    } catch (err: any) {
      setCreateStatus("error");
      setCreateError(err.message);
    }
  };

  /* ── Derived presentation groups ── */
  const eventItems = events.filter((e) => e.type !== "award");
  const awardItems = events.filter((e) => e.type === "award");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 font-sans flex-grow">
      {!selectedEvent ? (
        <>
          {/* ── Page header ── */}
          <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                Community &amp; Recognition
              </span>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-aur-primary sm:text-4xl">
                Events &amp; Awards
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
                AUR programs and honours celebrating student success, research achievement,
                academic leadership, and institutional impact across Asia.
              </p>
            </div>
            {isAdmin && (
              <Button
                type="button"
                onClick={() => setShowCreateForm((prev) => !prev)}
                className="bg-aur-primary text-white hover:bg-aur-primary/90 shrink-0"
              >
                <Calendar className="h-4 w-4" />
                {showCreateForm ? "Cancel" : "Create event"}
              </Button>
            )}
          </div>

          {/* ── Admin: create form ── */}
          {isAdmin && showCreateForm && (
            <section
              aria-label="Create a new event or award"
              className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
            >
              <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
                <Calendar className="h-5 w-5 text-amber-500" aria-hidden="true" />
                New event or award
              </h2>

              {createStatus === "success" ? (
                <div className="flex flex-col items-center rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                  <CheckCircle className="mb-2 h-8 w-8 text-green-600" aria-hidden="true" />
                  <p className="text-sm font-semibold text-green-800">Event published successfully.</p>
                </div>
              ) : (
                <form onSubmit={handleCreateSubmit} className="max-w-2xl space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="create-title">Title</Label>
                    <Input
                      id="create-title"
                      required
                      type="text"
                      value={createForm.title}
                      onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. AUR Research Innovation Summit"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="create-description">Description</Label>
                    <textarea
                      id="create-description"
                      required
                      value={createForm.description}
                      onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                      className="flex min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-aur-primary/40"
                      placeholder="Brief description of the event or award"
                    />
                  </div>

                  <div className="max-w-xs space-y-1.5">
                    <Label htmlFor="create-type">Type</Label>
                    <select
                      id="create-type"
                      value={createForm.type}
                      onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-aur-primary/40"
                    >
                      <option value="event">Event</option>
                      <option value="award">Award</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="create-eligibility">Eligibility criteria</Label>
                    <textarea
                      id="create-eligibility"
                      value={createForm.eligibility_criteria}
                      onChange={(e) => setCreateForm((f) => ({ ...f, eligibility_criteria: e.target.value }))}
                      className="flex min-h-[70px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-aur-primary/40"
                      placeholder="e.g. Open to all accredited universities"
                    />
                  </div>

                  {createStatus === "error" && createError && (
                    <Alert variant="destructive">
                      <AlertTitle>Could not publish</AlertTitle>
                      <AlertDescription>{createError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createStatus === "submitting"}
                      className="bg-aur-primary text-white hover:bg-aur-primary/90"
                    >
                      {createStatus === "submitting" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Publishing
                        </>
                      ) : (
                        "Publish event"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* ── Loading skeletons ── */}
          {loading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true" aria-label="Loading events">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex gap-4">
                    <Skeleton className="h-14 w-14 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && events.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
              <Calendar className="mx-auto mb-3 h-8 w-8 text-slate-300" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-700">No events or awards are currently listed.</p>
              <p className="mt-1 text-sm text-slate-500">
                {isAdmin
                  ? "Use the Create event button above to publish the first one."
                  : "Check back soon — new events and awards appear here as they are announced."}
              </p>
            </div>
          )}

          {!loading && events.length > 0 && (
            <div className="space-y-12">
              {/* ── AUR events ── */}
              {eventItems.length > 0 && (
                <section aria-labelledby="upcoming-events-heading">
                  <h2
                    id="upcoming-events-heading"
                    className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500"
                  >
                    AUR events
                  </h2>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {eventItems.map((event) => (
                      <article
                        key={event.id}
                        className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex gap-4">
                          <div
                            aria-hidden="true"
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-aur-primary/15 bg-aur-primary/5 text-aur-primary"
                          >
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Badge className="mb-2 border-transparent bg-amber-400/20 text-amber-800">
                              Applications open
                            </Badge>
                            <h3 className="text-base font-bold leading-snug text-slate-900">
                              {event.title}
                            </h3>
                          </div>
                        </div>
                        {event.description && (
                          <p className="mt-3 line-clamp-3 flex-grow text-sm leading-relaxed text-slate-600">
                            {event.description}
                          </p>
                        )}
                        <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEventId(event.id)}
                            aria-label={`View details and apply for ${event.title}`}
                            className="text-aur-primary hover:text-aur-primary"
                          >
                            View &amp; apply <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Awards: ceremonial AUR honours gallery ── */}
              {awardItems.length > 0 && (
                <section
                  aria-labelledby="awards-heading"
                  className="relative overflow-hidden rounded-[2rem] border border-amber-300/30 bg-[#15375f] text-white shadow-[0_30px_80px_-36px_rgba(15,35,65,0.9)]"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_12%_8%,rgba(251,191,36,0.16),transparent_28%),radial-gradient(circle_at_92%_88%,rgba(147,197,253,0.12),transparent_34%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-3 rounded-[1.45rem] border border-white/10"
                  />

                  <div className="relative p-6 sm:p-8 lg:p-10">
                    <header className="mb-8 flex items-center justify-between gap-6 border-b border-amber-200/20 pb-7">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">
                          The AUR Honours
                        </span>
                        <h2
                          id="awards-heading"
                          className="mt-2 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl"
                        >
                          Achievement Awards
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100/75">
                          AUR&apos;s highest distinctions celebrate the people and university
                          initiatives advancing higher education across Asia.
                        </p>
                      </div>
                      <div
                        aria-hidden="true"
                        className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-full border border-amber-200/50 bg-[radial-gradient(circle_at_35%_30%,#fde68a,#fbbf24_48%,#b7791f)] shadow-[0_0_0_7px_rgba(251,191,36,0.08)] sm:flex"
                      >
                        <Trophy className="h-9 w-9 text-[#15375f]" strokeWidth={1.8} />
                      </div>
                    </header>

                    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {awardItems.map((award) => (
                        <li key={award.id}>
                            <article
                              className="group relative flex h-full min-h-[270px] flex-col overflow-hidden rounded-2xl border border-amber-200/20 bg-white/[0.07] p-5 transition-[transform,border-color,background-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-amber-200/45 hover:bg-white/[0.1] hover:shadow-[0_20px_45px_-28px_rgba(251,191,36,0.5)]"
                            >
                              <Award
                                aria-hidden="true"
                                className="pointer-events-none absolute -bottom-8 -right-6 h-36 w-36 rotate-[-10deg] text-white/[0.035]"
                                strokeWidth={1}
                              />

                              <div className="relative mb-5 flex items-center justify-between gap-3">
                                <div
                                  aria-hidden="true"
                                  className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-100/60 bg-[radial-gradient(circle_at_35%_30%,#fef3c7,#fbbf24_55%,#b7791f)] text-[#15375f] shadow-[0_0_0_5px_rgba(251,191,36,0.07)]"
                                >
                                  <Award className="h-6 w-6" strokeWidth={2} />
                                </div>
                                <span className="text-right text-[9px] font-bold uppercase tracking-[0.2em] text-amber-200/70">
                                  AUR Award
                                </span>
                              </div>

                              <div className="relative flex flex-1 flex-col">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                                  {AUR_AWARD_FOCUS[award.id] ?? "Achievement"}
                                </p>
                                <h3 className="mt-2 font-serif text-xl font-bold leading-snug text-white">
                                  {award.title}
                                </h3>
                                {award.description && (
                                  <p className="mt-3 flex-1 text-sm leading-relaxed text-blue-100/70">
                                    {award.description}
                                  </p>
                                )}

                                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200">
                                    Nominations open
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedEventId(award.id)}
                                    aria-label={`View details and apply for ${award.title}`}
                                    className="ml-auto text-white hover:bg-amber-300 hover:text-[#15375f]"
                                  >
                                    View award <ArrowRight className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </article>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      ) : (
        /* ── Detail view ── */
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-6 text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to events &amp; awards
          </Button>

          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-aur-primary/[0.03] p-6 md:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Badge
                  className={cn(
                    "border-transparent",
                    selectedEvent.type === "award"
                      ? "bg-amber-400/20 text-amber-800"
                      : "bg-aur-primary/10 text-aur-primary"
                  )}
                >
                  {selectedEvent.type === "award" ? (
                    <Award className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Users className="h-3 w-3" aria-hidden="true" />
                  )}
                  {selectedEvent.type === "award" ? "Award" : "Event"}
                </Badge>
              </div>
              <h1 className="mb-6 text-2xl font-bold leading-tight tracking-tight text-aur-primary md:text-4xl">
                {selectedEvent.title}
              </h1>
              {!showApplicationForm && applicationStatus !== "success" && (
                <Button
                  onClick={() => setShowApplicationForm(true)}
                  className="bg-aur-primary text-white hover:bg-aur-primary/90"
                >
                  Apply
                </Button>
              )}
            </header>

            <div className="p-6 md:p-10">
              {showApplicationForm ? (
                <div className="max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <Users className="h-5 w-5 text-amber-500" aria-hidden="true" /> Submit application
                  </h2>

                  {applicationStatus === "success" ? (
                    <div className="flex flex-col items-center rounded-xl border border-green-200 bg-green-50 p-8 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-8 w-8 text-green-600" aria-hidden="true" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-green-800">Application submitted</h3>
                      <p className="max-w-md text-sm text-green-700">
                        Your application for {selectedEvent.title} has been submitted and is now under review.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleApplySubmit} className="space-y-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="apply-university">Applying university</Label>
                        <select
                          id="apply-university"
                          required
                          value={selectedUniversityId}
                          onChange={(e) => setSelectedUniversityId(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-aur-primary/40"
                        >
                          <option value="">Select a university</option>
                          {applicationUniversities.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="apply-files">Supporting documents (optional)</Label>
                        <Input
                          id="apply-files"
                          type="file"
                          multiple
                          onChange={(e) => setFiles(e.target.files)}
                        />
                      </div>

                      {applicationStatus === "error" && applicationError && (
                        <Alert variant="destructive">
                          <AlertTitle>Application not submitted</AlertTitle>
                          <AlertDescription>{applicationError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex items-center gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowApplicationForm(false)}>
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={applicationStatus === "submitting"}
                          className="bg-aur-primary text-white hover:bg-aur-primary/90"
                        >
                          {applicationStatus === "submitting" ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Submitting
                            </>
                          ) : (
                            "Submit application"
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="max-w-2xl animate-in fade-in duration-300">
                  <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    About this {selectedEvent.type === "award" ? "award" : "event"}
                  </h2>
                  <p className="leading-relaxed text-slate-700">{selectedEvent.description}</p>

                  {selectedEvent.eligibility_criteria && (
                    <>
                      <Separator className="my-8" />
                      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Eligibility criteria
                      </h2>
                      <p className="leading-relaxed text-slate-700">{selectedEvent.eligibility_criteria}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
