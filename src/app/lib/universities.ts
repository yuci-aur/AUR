import type { University } from "../types";

export const UNIVERSITY_PAGE_SIZE = 20;

export type UniversityCursor = number;

export interface UniversityPage {
  universities: University[];
  cursor: UniversityCursor | null;
  hasMore: boolean;
  total: number;
}

let firstPageCache: UniversityPage | null = null;
let firstPageRequest: Promise<UniversityPage> | null = null;

type BackendUniversity = Record<string, unknown> & {
  id?: string;
  name?: string;
  location?: string;
  subregion?: string;
  rank?: number | string | null;
  rank_2025?: number | string | null;
  overall?: number | string | null;
  academicReputation?: number | string | null;
  employerReputation?: number | string | null;
  employability?: number | string | null;
  facultyStudentRatio?: number | string | null;
  teaching?: number | string | null;
  citations?: number | string | null;
  intlStudents?: number | string | null;
  intlResearchNetwork?: number | string | null;
  papersPerFaculty?: number | string | null;
  isPublic?: boolean | null;
  subjects?: string[];
  languages?: string[];
  tuition?: string | null;
  description?: string | null;
  programs?: string[];
  campusPhoto?: string | null;
  logoUrl?: string | null;
  hasMedicine?: boolean | null;
  hasScholarship?: boolean | null;
  website?: string;
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function score(...values: unknown[]): number {
  for (const value of values) {
    const parsed = toNumber(value, NaN);
    if (Number.isFinite(parsed)) return Math.max(0, Math.min(100, parsed));
  }
  return 0;
}

function inferSubjects(uni: BackendUniversity): string[] {
  if (Array.isArray(uni.subjects) && uni.subjects.length > 0) return uni.subjects;

  const focus = String(uni.focus ?? "").toLowerCase();
  const name = String(uni.name ?? "").toLowerCase();
  const subjects = new Set<string>();

  if (focus.includes("medical") || name.includes("medical") || name.includes("medicine")) {
    subjects.add("Medicine");
  }
  if (focus.includes("engineering") || name.includes("technology") || name.includes("technical")) {
    subjects.add("Engineering");
  }
  if (focus.includes("comprehensive")) {
    subjects.add("Sciences");
    subjects.add("Business");
    subjects.add("Humanities");
  }
  if (subjects.size === 0) subjects.add("Sciences");

  return Array.from(subjects);
}

function inferLanguages(uni: BackendUniversity): string[] {
  if (Array.isArray(uni.languages) && uni.languages.length > 0) return uni.languages;
  if (uni.location === "Singapore" || uni.location === "Hong Kong") return ["English"];
  return ["English", "Local language"];
}

export function mapBackendUniversity(uni: BackendUniversity, index: number): University {
  const name = uni.name ?? "Unknown University";
  const location = uni.location ?? "Unknown";
  const subjects = inferSubjects(uni);
  const overall = score(uni.overall);
  const academicReputation = score(uni.academicReputation, uni.intlResearchNetwork, overall);
  const employerReputation = score(uni.employerReputation, uni.employability, overall);
  const teaching = score(uni.facultyStudentRatio, uni.teaching, overall);
  const citations = score(uni.citations, uni.papersPerFaculty, overall);
  const intlStudents = score(uni.intlStudents, overall);
  const research = score(uni.academicReputation, uni.intlResearchNetwork, uni.papersPerFaculty, overall);
  const aurRank = index + 1;
  const sourceWorldRank = toNumber(uni.rank, NaN);

  return {
    id: uni.id ?? String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    location,
    overall,
    citations,
    employability: score(uni.employability, overall),
    intlStudents,
    teaching,
    research,
    academicReputation,
    employerReputation,
    facultyStudentRatio: teaching,
    subjects,
    languages: inferLanguages(uni),
    tuition: uni.tuition ?? "Contact university",
    description:
      uni.description ??
      `${name} is listed in the Asia University Rankings dataset for ${location}. Profile details are populated from the live AUR database where available.`,
    history: overall > 0 ? [aurRank] : [],
    worldRank:
      Number.isFinite(sourceWorldRank) && sourceWorldRank > 0
        ? Math.round(sourceWorldRank)
        : null,
    rankChange: null,
    programs: Array.isArray(uni.programs) && uni.programs.length > 0
      ? uni.programs
      : subjects.map((subject) => `${subject} programs`),
    // Real images only — no stock/placeholder fallback. Empty string when the
    // record has no photo; consumers must guard before rendering.
    campusPhoto: uni.campusPhoto ?? "",
    logo: uni.logoUrl ?? undefined,
    website: uni.website,
    hasMedicine:
      typeof uni.hasMedicine === "boolean" ? uni.hasMedicine : subjects.includes("Medicine"),
    isPublic: typeof uni.isPublic === "boolean" ? uni.isPublic : undefined,
    hasScholarship:
      typeof uni.hasScholarship === "boolean" ? uni.hasScholarship : undefined,
  };
}

async function queryUniversityPage(
  cursor: UniversityCursor | null,
  pageSize: number,
  rankOffset: number
): Promise<UniversityPage> {
  const offset = cursor ?? 0;
  const response = await fetch(
    `/api/data/universities?offset=${offset}&limit=${pageSize}`,
  );
  if (!response.ok) throw new Error("Unable to load university rankings.");
  const payload = (await response.json()) as {
    items: BackendUniversity[];
    total: number;
    nextOffset: number;
    hasMore: boolean;
  };
  const universities = payload.items.map((university, index) =>
    mapBackendUniversity(university, rankOffset + index)
  );

  return {
    universities,
    cursor: payload.hasMore ? payload.nextOffset : null,
    hasMore: payload.hasMore,
    total: payload.total,
  };
}

export function fetchUniversityPage(
  cursor: UniversityCursor | null = null,
  pageSize = UNIVERSITY_PAGE_SIZE,
  rankOffset = 0
): Promise<UniversityPage> {
  const normalizedPageSize = Math.max(1, Math.min(pageSize, 50));
  const isDefaultFirstPage =
    cursor === null &&
    normalizedPageSize === UNIVERSITY_PAGE_SIZE &&
    rankOffset === 0;

  if (!isDefaultFirstPage) {
    return queryUniversityPage(cursor, normalizedPageSize, rankOffset);
  }

  if (firstPageCache) return Promise.resolve(firstPageCache);
  if (!firstPageRequest) {
    firstPageRequest = queryUniversityPage(null, normalizedPageSize, 0)
      .then((page) => {
        firstPageCache = page;
        return page;
      })
      .finally(() => {
        firstPageRequest = null;
      });
  }
  return firstPageRequest;
}

export function clearUniversityQueryCache() {
  firstPageCache = null;
  firstPageRequest = null;
}

