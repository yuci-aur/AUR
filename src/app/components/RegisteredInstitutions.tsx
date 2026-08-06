"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Building2,
  ExternalLink,
  Globe2,
  Loader2,
  MapPin,
  Search,
  X,
} from "lucide-react";

export type RegisteredInstitution = {
  id: string;
  institutionName: string;
  institutionType: string;
  country: string;
  website: string;
  description: string;
  logoUrl: string | null;
  campusPhoto: string | null;
  approvedAt: string | null;
};

const PAGE_SIZE = 12;

/**
 * Public directory of institutions that registered with AUR and passed admin
 * review. These carry no ranking score — they are deliberately kept out of the
 * rankings table so an unscored listing never reads as a ranked result.
 */
export default function RegisteredInstitutions() {
  const [institutions, setInstitutions] = useState<RegisteredInstitution[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<RegisteredInstitution | null>(null);

  const fetchPage = useCallback(
    async (offset: number, term: string) => {
      const query = new URLSearchParams({
        offset: String(offset),
        limit: String(PAGE_SIZE),
      });
      if (term) query.set("search", term);
      const response = await fetch(`/api/data/institutions?${query}`);
      if (!response.ok) throw new Error("Unable to load registered institutions.");
      return (await response.json()) as {
        items: RegisteredInstitution[];
        total: number;
        hasMore: boolean;
      };
    },
    [],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      fetchPage(0, search.trim())
        .then((data) => {
          if (!active) return;
          setInstitutions(data.items);
          setTotal(data.total);
        })
        .catch((reason: unknown) => {
          if (!active) return;
          setError(
            reason instanceof Error ? reason.message : "Something went wrong.",
          );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchPage, search]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchPage(institutions.length, search.trim());
      setInstitutions((prev) => [...prev, ...data.items]);
      setTotal(data.total);
    } catch {
      setError("Unable to load more institutions.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          <BadgeCheck className="h-3.5 w-3.5" />
          Verified by AUR
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[#17365f] sm:text-4xl">
          Registered Institutions
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Institutions that registered directly with AUR and completed
          verification. These listings are self-reported and reviewed for
          authenticity; they are not scored in the prestige rankings.
        </p>
      </header>

      <div className="relative mb-8 max-w-md">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by institution or country…"
          aria-label="Search registered institutions"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#17365f]/30"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : institutions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-600">
            {search
              ? "No registered institutions match your search."
              : "No institutions have been verified yet."}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {total} verified {total === 1 ? "institution" : "institutions"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {institutions.map((institution) => (
              <InstitutionCard
                key={institution.id}
                institution={institution}
                onOpen={() => setSelected(institution)}
              />
            ))}
          </div>

          {institutions.length < total && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#17365f] hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                Load more
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <InstitutionDetail
          institution={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}

function InstitutionCard({
  institution,
  onOpen,
}: {
  institution: RegisteredInstitution;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17365f]/40"
    >
      <div className="relative h-36 w-full bg-slate-100">
        {institution.campusPhoto ? (
          // Institution-supplied Cloudinary asset rendered without next/image so
          // the listing does not depend on remote-pattern configuration.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={institution.campusPhoto}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-8 w-8 text-slate-300" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          {institution.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={institution.logoUrl}
              alt=""
              loading="lazy"
              className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 bg-white object-contain"
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
              <Building2 className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate font-bold text-[#17365f]">
              {institution.institutionName}
            </h2>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {institution.country}
            </p>
          </div>
        </div>
        {institution.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
            {institution.description}
          </p>
        )}
        <span className="mt-4 inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          {institution.institutionType}
        </span>
      </div>
    </button>
  );
}

function InstitutionDetail({
  institution,
  onClose,
}: {
  institution: RegisteredInstitution;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={institution.institutionName}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative h-48 w-full bg-slate-100">
          {institution.campusPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={institution.campusPhoto}
              alt={`${institution.institutionName} campus`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-10 w-10 text-slate-300" aria-hidden="true" />
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-600 shadow-sm hover:bg-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            {institution.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={institution.logoUrl}
                alt={`${institution.institutionName} logo`}
                className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 bg-white object-contain"
              />
            ) : null}
            <div className="min-w-0">
              <h2 className="text-2xl font-black tracking-tight text-[#17365f]">
                {institution.institutionName}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {institution.institutionType}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {institution.country}
                </span>
              </p>
            </div>
          </div>

          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            Verified by AUR
            {institution.approvedAt
              ? ` · ${new Date(institution.approvedAt).toLocaleDateString()}`
              : ""}
          </span>

          {institution.description && (
            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">
              {institution.description}
            </p>
          )}

          <a
            href={institution.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#17365f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102a4c]"
          >
            <Globe2 className="h-4 w-4" />
            Visit official website
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
            Details on this page are self-reported by the institution and
            verified by AUR for authenticity. They do not contribute to prestige
            ranking scores.
          </p>
        </div>
      </div>
    </div>
  );
}
