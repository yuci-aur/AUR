import { sql } from "@/app/lib/neon";

/**
 * Public listing of institutions AUR has verified and approved.
 *
 * These are self-registered institutions, kept separate from the ranked
 * `aur_universities` table: they carry no ranking score, so surfacing them in
 * the rankings would imply a score that was never calculated.
 *
 * Only approved rows are exposed, and representative name/email are withheld —
 * they are private contact details collected for review, not listing data.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const pageSize = Math.max(
    1,
    Math.min(50, Number(url.searchParams.get("limit")) || 20),
  );
  const search = (url.searchParams.get("search") ?? "").trim().slice(0, 100);
  const pattern = search ? `%${search}%` : null;

  const rows = await sql`
    SELECT
      firebase_uid AS id,
      institution_name AS "institutionName",
      institution_type AS "institutionType",
      country,
      website,
      description,
      logo_url AS "logoUrl",
      campus_photo AS "campusPhoto",
      reviewed_at AS "approvedAt",
      count(*) OVER()::int AS total
    FROM aur_institution_applications
    WHERE status = 'approved'
      AND (
        ${pattern}::text IS NULL
        OR institution_name ILIKE ${pattern}
        OR country ILIKE ${pattern}
      )
    ORDER BY institution_name ASC
    LIMIT ${pageSize}
    OFFSET ${offset}
  `;

  // The window count only rides along on returned rows, so an offset past the
  // end needs its own count to avoid reporting a total of zero.
  const total =
    rows.length > 0
      ? Number(rows[0].total)
      : Number(
          (
            await sql`
              SELECT count(*)::int AS total
              FROM aur_institution_applications
              WHERE status = 'approved'
                AND (
                  ${pattern}::text IS NULL
                  OR institution_name ILIKE ${pattern}
                  OR country ILIKE ${pattern}
                )
            `
          )[0].total,
        );

  return Response.json(
    {
      items: rows.map(({ total: _total, ...institution }) => institution),
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
