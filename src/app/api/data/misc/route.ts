import { sql } from "@/app/lib/neon";

/**
 * `methodology_versions` is an optional content table that is not created by
 * database/schema.sql. Querying a missing relation throws (Postgres 42P01),
 * which would surface as an unhandled 500 and break the calling page, so a
 * missing table degrades to an empty list instead.
 */
const UNDEFINED_TABLE = "42P01";

function isMissingTable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === UNDEFINED_TABLE
  );
}

export async function GET(request: Request) {
  const resource = new URL(request.url).searchParams.get("resource");

  if (resource === "university-directory") {
    const rows = await sql`
      SELECT id, name
      FROM aur_universities
      ORDER BY name ASC
    `;
    return Response.json(rows, {
      headers: { "Cache-Control": "public, s-maxage=600" },
    });
  }

  // Dataset-wide totals for the homepage stats strip. These cannot be derived
  // client-side because the university list is paginated (20 per page), so
  // counting the loaded array would report the page size, not the dataset.
  if (resource === "university-stats") {
    const rows = await sql`
      SELECT
        count(*)::int AS total,
        count(DISTINCT NULLIF(data->>'country', ''))::int AS countries
      FROM aur_universities
    `;
    return Response.json(
      {
        total: Number(rows[0]?.total ?? 0),
        countries: Number(rows[0]?.countries ?? 0),
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  }

  if (resource === "methodology") {
    try {
      const rows = await sql`
        SELECT
          id::text AS id, version, title, description,
          release_date, is_current, created_at
        FROM methodology_versions
        ORDER BY release_date DESC
      `;
      return Response.json(rows, {
        headers: { "Cache-Control": "public, s-maxage=600" },
      });
    } catch (error) {
      if (isMissingTable(error)) return Response.json([]);
      throw error;
    }
  }

  return Response.json({ message: "Unknown resource." }, { status: 400 });
}
