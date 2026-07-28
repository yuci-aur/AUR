import { sql } from "@/app/lib/neon";

export async function GET() {
  const rows = await sql`
    SELECT *
    FROM aur_events
    ORDER BY created_at ASC
  `;
  return Response.json(rows, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
