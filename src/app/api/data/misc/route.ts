import { sql } from "@/app/lib/neon";

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

  if (resource === "methodology") {
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
  }

  if (resource === "notifications") {
    const rows = await sql`
      SELECT
        id::text AS id, title, description, category,
        is_read, created_at
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 20
    `;
    return Response.json(rows, {
      headers: { "Cache-Control": "public, s-maxage=60" },
    });
  }

  return Response.json({ message: "Unknown resource." }, { status: 400 });
}
