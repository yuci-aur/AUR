import { sql } from "@/app/lib/neon";

export async function GET() {
  const rows = await sql`
    SELECT *
    FROM aur_blogs
    WHERE status = 'published'
    ORDER BY created_at DESC
  `;
  return Response.json(rows, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
