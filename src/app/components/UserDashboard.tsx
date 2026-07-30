"use client";

import { useEffect, useState } from "react";
import { Banknote, Bookmark, Building2, ChevronRight, Loader2, LogOut, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authenticatedFetch } from "../lib/authenticated-fetch";

interface University {
  id: string;
  name: string;
  location: string;
  tuition: string;
  overall: number;
}

interface UserDashboardProps {
  savedUniversities: University[];
  onUniversitySelect: (id: string) => void;
  onNavigateToRankings: () => void;
  onSignOut: () => void;
  onNavigateToProfile?: () => void;
}

export default function UserDashboard({
  savedUniversities,
  onUniversitySelect,
  onNavigateToRankings,
  onSignOut,
  onNavigateToProfile,
}: UserDashboardProps) {
  // The saved shortlist is a student/applicant feature. Institution accounts
  // manage their listing from the profile instead, so they get a pointer there
  // rather than an empty portfolio they can never fill.
  const [accountType, setAccountType] = useState<
    "student" | "institution" | null
  >(null);

  useEffect(() => {
    let active = true;

    authenticatedFetch("/api/account")
      .then((response) => response.json() as Promise<{
        profile?: { account_type?: string };
      }>)
      .then((account) => {
        if (!active) return;
        setAccountType(
          account.profile?.account_type === "institution"
            ? "institution"
            : "student",
        );
      })
      .catch(() => {
        // Fall back to the student view rather than blocking the page.
        if (active) setAccountType("student");
      });

    return () => {
      active = false;
    };
  }, []);

  if (accountType === null) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center text-[var(--aur-text-muted)]">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
        Loading your workspace…
      </div>
    );
  }

  if (accountType === "institution") {
    return (
      <div className="mx-auto w-full max-w-6xl animate-fadeIn p-4 md:p-6 lg:p-8">
        <div className="aur-hero-accent mb-8">
          <span className="aur-caption">Institution workspace</span>
          <h1 className="aur-section-title mt-2 text-3xl leading-tight md:text-4xl">
            Account
          </h1>
          <p className="mt-3 text-sm text-[var(--aur-text-muted)]">
            Manage your institution profile and application status.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="shrink-0 lg:w-64" aria-label="Account actions">
            <div className="flex flex-row gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              <div className="flex items-center gap-3 rounded-xl bg-[var(--aur-text)] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--background)]">
                <Building2 className="h-4.5 w-4.5" />
                <span>Account</span>
              </div>

              <Separator className="my-4 hidden bg-[var(--aur-border)] lg:block" />

              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-500 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>Sign out</span>
              </button>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <section className="w-full rounded-2xl border border-[var(--aur-border)] bg-[var(--aur-surface)] p-6 shadow-sm lg:p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[var(--aur-text)]">
                    Institution profile
                  </h2>
                  <p className="mt-1 text-xs text-[var(--aur-text-muted)]">
                    Your institution details, verification status, and listing
                    are managed from your profile.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--aur-border-strong)] bg-[var(--aur-surface-2)] py-16 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--aur-border)]">
                    <Building2 className="h-5 w-5 text-[var(--aur-text-muted)]" />
                  </div>
                  <h3 className="mb-1 text-sm font-bold text-[var(--aur-text)]">
                    Manage your institution
                  </h3>
                  <p className="mb-6 max-w-xs text-xs text-[var(--aur-text-muted)]">
                    Update your institution details and track your application
                    status from your profile.
                  </p>
                  {onNavigateToProfile && (
                    <Button
                      type="button"
                      onClick={onNavigateToProfile}
                      className="h-auto gap-2 rounded-lg border-[var(--aur-text)] bg-[var(--aur-text)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--background)] transition-opacity hover:bg-[var(--aur-text)] hover:opacity-80"
                    >
                      Go to profile
                      <ChevronRight className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl animate-fadeIn p-4 md:p-6 lg:p-8">
      <div className="aur-hero-accent mb-8">
        <span className="aur-caption">Personal workspace</span>
        <h1 className="aur-section-title mt-2 text-3xl leading-tight md:text-4xl">
          Saved Portfolio
        </h1>
        <p className="mt-3 text-sm text-[var(--aur-text-muted)]">
          Keep the institutions you want to revisit and compare.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="shrink-0 lg:w-64" aria-label="Portfolio actions">
          <div className="flex flex-row gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            <div className="flex items-center gap-3 rounded-xl bg-[var(--aur-text)] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--background)]">
              <Bookmark className="h-4.5 w-4.5" />
              <span>Saved portfolio</span>
            </div>

            <Separator className="my-4 hidden bg-[var(--aur-border)] lg:block" />

            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-500 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <section className="w-full rounded-2xl border border-[var(--aur-border)] bg-[var(--aur-surface)] p-6 shadow-sm lg:p-8">
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-[var(--aur-text)]">
                  Saved institutions
                </h2>
                <p className="mt-1 text-xs text-[var(--aur-text-muted)]">
                  Universities saved to your personal shortlist for quick comparison.
                </p>
              </div>

              {savedUniversities.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {savedUniversities.map((university) => (
                    <button
                      type="button"
                      key={university.id}
                      onClick={() => onUniversitySelect(university.id)}
                      className="group flex flex-col justify-between rounded-xl border border-[var(--aur-border)] bg-[var(--aur-surface-2)] p-5 text-left transition-colors hover:border-amber-500/50"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <h3 className="text-sm font-bold text-[var(--aur-text)] group-hover:underline group-hover:decoration-amber-500 group-hover:underline-offset-4">
                          {university.name}
                        </h3>
                        <div className="flex shrink-0 flex-col items-end">
                          <span className="font-mono text-xl font-bold leading-none text-[var(--aur-text)]">
                            {university.overall.toFixed(1)}
                          </span>
                          <span className="mt-1 text-[8px] uppercase tracking-wider text-[var(--aur-text-muted)]">
                            Score
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-[10px] font-medium uppercase tracking-wide text-[var(--aur-text-muted)]">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          {university.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Banknote className="h-3 w-3" />
                          {university.tuition}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--aur-border-strong)] bg-[var(--aur-surface-2)] py-16 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--aur-border)]">
                    <Bookmark className="h-5 w-5 text-[var(--aur-text-muted)]" />
                  </div>
                  <h3 className="mb-1 text-sm font-bold text-[var(--aur-text)]">
                    Your portfolio is empty
                  </h3>
                  <p className="mb-6 max-w-xs text-xs text-[var(--aur-text-muted)]">
                    Save institutions from the rankings or directory to find them here.
                  </p>
                  <Button
                    type="button"
                    onClick={onNavigateToRankings}
                    className="h-auto gap-2 rounded-lg border-[var(--aur-text)] bg-[var(--aur-text)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--background)] transition-opacity hover:bg-[var(--aur-text)] hover:opacity-80"
                  >
                    Explore rankings
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
