import { sql } from "@/app/lib/neon";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const pageSize = Math.max(
    1,
    Math.min(50, Number(url.searchParams.get("limit")) || 20),
  );

  const rows = await sql`
    SELECT id, data, count(*) OVER()::int AS total
    FROM aur_universities
    ORDER BY overall DESC NULLS LAST, id ASC
    LIMIT ${pageSize}
    OFFSET ${offset}
  `;
  const total =
    rows.length > 0
      ? Number(rows[0].total)
      : Number(
          (await sql`SELECT count(*)::int AS total FROM aur_universities`)[0]
            .total,
        );

  return Response.json(
    {
      items: rows.map((row) => ({
        ...(row.data as Record<string, unknown>),
        id: String(row.id),
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
