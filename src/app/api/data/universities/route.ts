import { sql } from "@/app/lib/neon";

/**
 * Escapes the LIKE metacharacters so a user typing `%` or `_` searches for
 * those literal characters instead of turning the query into a wildcard that
 * matches the entire table.
 */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Acronyms users type that do not appear as a substring of the stored name.
 * "IIT" would otherwise match only "Sri Lanka Institute of Information
 * Technology (SLIIT)" — on the letters inside SLIIT — while missing all 23
 * Indian Institutes of Technology.
 *
 * Keyed by the typed term; the value is matched against the name in addition
 * to the raw term, so "IIT Delhi" and "Indian Institute of Technology Delhi"
 * both work.
 */
const SEARCH_ALIASES: Record<string, string> = {
  iit: "Indian Institute of Technology",
  iisc: "Indian Institute of Science",
  iiit: "Indian Institute of Information Technology",
  nit: "National Institute of Technology",
  bits: "Birla Institute of Technology",
  vit: "Vellore Institute of Technology",
  jnu: "Jawaharlal Nehru University",
  bhu: "Banaras Hindu University",
  du: "University of Delhi",
  nus: "National University of Singapore",
  ntu: "Nanyang Technological University",
  hkust: "Hong Kong University of Science and Technology",
  hku: "University of Hong Kong",
  cuhk: "Chinese University of Hong Kong",
  kaist: "Korea Advanced Institute of Science",
  postech: "Pohang University of Science and Technology",
  snu: "Seoul National University",
  ust: "University of Science and Technology",
  utokyo: "University of Tokyo",
  um: "Universiti Malaya",
  upm: "Universiti Putra Malaysia",
  ukm: "Universiti Kebangsaan Malaysia",
  usm: "Universiti Sains Malaysia",
  utm: "Universiti Teknologi Malaysia",
  aub: "American University of Beirut",
  kfupm: "King Fahd University of Petroleum",
  ku: "Kuwait University",
};

/**
 * Expands a typed acronym into the phrase stored in `name`, so an acronym
 * search reaches records that never spell the acronym out. Returns null when
 * the term is not a known alias.
 */
function aliasPattern(search: string): string | null {
  const expanded = SEARCH_ALIASES[search.trim().toLowerCase()];
  if (expanded) return `%${escapeLike(expanded)}%`;

  // Handles "IIT Delhi" / "NIT Trichy": expand the leading acronym and keep the
  // campus qualifier, so the two halves stay in order within the stored name.
  const parts = search.trim().split(/\s+/);
  if (parts.length >= 2) {
    const head = SEARCH_ALIASES[parts[0].toLowerCase()];
    if (head) {
      const tail = parts.slice(1).join(" ");
      return `%${escapeLike(head)}%${escapeLike(tail)}%`;
    }
  }

  return null;
}

/**
 * Upper bound for `limit`. High enough that a filtered result set (a country,
 * or a search such as "IIT") is returned complete rather than truncated, while
 * still bounding what a single request can pull from the table.
 */
const MAX_PAGE_SIZE = 1000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const pageSize = Math.max(
    1,
    Math.min(MAX_PAGE_SIZE, Number(url.searchParams.get("limit")) || 20),
  );
  const search = (url.searchParams.get("search") ?? "").trim().slice(0, 100);
  const country = (url.searchParams.get("country") ?? "").trim();
  const medicineOnly = url.searchParams.get("medicineOnly") === "true";

  // Filtering runs in SQL rather than in the browser: the client only holds the
  // current 20-row page, so a client-side filter would search that page instead
  // of the full dataset.
  const searchPattern = search ? `%${escapeLike(search)}%` : null;
  const aliasSearchPattern = search ? aliasPattern(search) : null;

  // `aurRank` is ranked over the unfiltered table, so a filtered result keeps
  // the institution's true position in the rankings. Deriving it from the row's
  // index within the response would renumber every search hit from 1.
  const rows = await sql`
    WITH ranked AS (
      SELECT
        id,
        data,
        overall,
        name,
        location,
        row_number() OVER (ORDER BY overall DESC NULLS LAST, id ASC)::int
          AS aur_rank
      FROM aur_universities
    )
    SELECT id, data, aur_rank, count(*) OVER()::int AS total
    FROM ranked
    WHERE (
        ${searchPattern}::text IS NULL
        OR name ILIKE ${searchPattern} ESCAPE '\'
        OR location ILIKE ${searchPattern} ESCAPE '\'
        OR (
          ${aliasSearchPattern}::text IS NOT NULL
          AND name ILIKE ${aliasSearchPattern} ESCAPE '\'
        )
      )
      AND (${country || null}::text IS NULL OR location = ${country || null})
      AND (
        ${medicineOnly} = false
        OR data->>'hasMedicine' = 'true'
        OR name ILIKE '%medic%'
      )
    ORDER BY overall DESC NULLS LAST, id ASC
    LIMIT ${pageSize}
    OFFSET ${offset}
  `;
  const total = rows.length > 0 ? Number(rows[0].total) : 0;

  return Response.json(
    {
      items: rows.map((row) => ({
        ...(row.data as Record<string, unknown>),
        id: String(row.id),
        aurRank: Number(row.aur_rank),
      })),
      total,
      nextOffset: offset + rows.length,
      hasMore: offset + rows.length < total,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
