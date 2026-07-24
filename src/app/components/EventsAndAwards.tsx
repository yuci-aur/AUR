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

/* ── Presentation helpers (no data invented — everything derives from the record) ── */

function parseDeadline(deadline: string | null): Date | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isPastDeadline(deadline: string | null): boolean {
  const d = parseDeadline(deadline);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

/** Calendar-leaf date block derived from the deadline. */
function DateBlock({ deadline, muted = false }: { deadline: string | null; muted?: boolean }) {
  const d = parseDeadline(deadline);
  return (
    <div
      className={cn(
        "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border text-center",
        muted
          ? "border-slate-200 bg-slate-50 text-slate-400"
          : "border-aur-primary/15 bg-aur-primary/5 text-aur-primary"
      )}
      aria-hidden="true"
    >
      {d ? (
        <>
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] leading-none">
            {d.toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="mt-0.5 text-xl font-bold leading-none tabular-nums">
            {d.getDate()}
          </span>
          <span className="mt-0.5 text-[9px] font-medium leading-none tabular-nums opacity-70">
            {d.getFullYear()}
          </span>
        </>
      ) : (
        <Calendar className="h-5 w-5 opacity-60" />
      )}
    </div>
  );
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
  const [loadError, setLoadError] = useState<string | null>(null);

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
      .then((data) => setEvents(data))
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

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

  /* ── Derived presentation groups (deadline-driven; nothing invented) ── */
  const eventItems = events.filter((e) => e.type !== "award");
  const awardItems = events.filter((e) => e.type === "award");
  const openEvents = eventItems.filter((e) => !isPastDeadline(e.deadline));
  const pastEvents = eventItems.filter((e) => isPastDeadline(e.deadline));

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
                Convenings and distinctions for the AUR university community. Deadlines shown
                are application deadlines.
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
                      placeholder="e.g. AUR Research Innovation Summit 2026"
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

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
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
                      <Label htmlFor="create-deadline">Deadline</Label>
                      <Input
                        id="create-deadline"
                        type="date"
                        value={createForm.deadline}
                        onChange={(e) => setCreateForm((f) => ({ ...f, deadline: e.target.value }))}
                      />
                    </div>
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

          {/* ── Load error ── */}
          {loadError && (
            <Alert variant="destructive">
              <AlertTitle>Events could not be loaded</AlertTitle>
              <AlertDescription>{loadError} — refresh the page to try again.</AlertDescription>
            </Alert>
          )}

          {/* ── Empty state ── */}
          {!loading && !loadError && events.length === 0 && (
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

          {!loading && !loadError && events.length > 0 && (
            <div className="space-y-12">
              {/* ── Upcoming events ── */}
              {eventItems.length > 0 && (
                <section aria-labelledby="upcoming-events-heading">
                  <h2
                    id="upcoming-events-heading"
                    className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500"
                  >
                    Upcoming events
                  </h2>

                  {openEvents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
                      <p className="text-sm font-semibold text-slate-700">No upcoming events right now.</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Past events are listed below; new ones appear here as they are announced.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {openEvents.map((event) => (
                        <article
                          key={event.id}
                          className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="flex gap-4">
                            <DateBlock deadline={event.deadline} />
                            <div className="min-w-0 flex-1">
                              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                <Badge className="border-transparent bg-amber-400/20 text-amber-800">
                                  Applications open
                                </Badge>
                                {event.deadline && (
                                  <span className="text-xs tabular-nums text-slate-500">
                                    Apply by {event.deadline}
                                  </span>
                                )}
                              </div>
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
                  )}

                  {/* ── Past events (quieter) ── */}
                  {pastEvents.length > 0 && (
                    <div className="mt-8">
                      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Past events
                      </h3>
                      <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {pastEvents.map((event) => (
                          <li key={event.id} className="flex items-center gap-4 px-4 py-3">
                            <DateBlock deadline={event.deadline} muted />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-600">{event.title}</p>
                              <p className="text-xs text-slate-400">
                                Deadline passed{event.deadline ? ` · ${event.deadline}` : ""}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEventId(event.id)}
                              aria-label={`View details of past event ${event.title}`}
                              className="shrink-0 text-slate-500"
                            >
                              Details
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {/* ── Awards: distinct navy material ── */}
              {awardItems.length > 0 && (
                <section
                  aria-labelledby="awards-heading"
                  className="overflow-hidden rounded-2xl bg-aur-primary text-white shadow-sm"
                >
                  <div className="p-6 md:p-8">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">
                      Recognition
                    </span>
                    <h2 id="awards-heading" className="mt-1 font-serif text-2xl font-bold md:text-3xl">
                      Awards
                    </h2>
                    <Separator className="my-5 bg-white/15" />
                    <ul className="space-y-1">
                      {awardItems.map((award) => {
                        const closed = isPastDeadline(award.deadline);
                        return (
                          <li key={award.id}>
                            <div className="flex items-start gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-white/5">
                              <Award
                                className={cn(
                                  "mt-0.5 h-5 w-5 shrink-0",
                                  closed ? "text-white/30" : "text-amber-400"
                                )}
                                aria-hidden="true"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-bold text-white">{award.title}</h3>
                                  {award.deadline &&
                                    (closed ? (
                                      <Badge className="border-white/20 bg-transparent text-white/50">
                                        Nominations closed
                                      </Badge>
                                    ) : (
                                      <Badge className="border-transparent bg-amber-400 text-aur-primary">
                                        Apply by {award.deadline}
                                      </Badge>
                                    ))}
                                </div>
                                {award.description && (
                                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/70">
                                    {award.description}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedEventId(award.id)}
                                aria-label={`View details and apply for ${award.title}`}
                                className="shrink-0 text-white/80 hover:bg-white/10 hover:text-white"
                              >
                                View <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
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
                {selectedEvent.deadline && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs tabular-nums",
                      isPastDeadline(selectedEvent.deadline)
                        ? "text-slate-400"
                        : "text-slate-600"
                    )}
                  >
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    {isPastDeadline(selectedEvent.deadline) ? "Deadline passed" : "Apply by"}{" "}
                    {selectedEvent.deadline}
                  </span>
                )}
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
                          {universities.map((u) => (
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
