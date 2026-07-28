import { sql } from "@/app/lib/neon";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/data/blogs/[id]">,
) {
  const { id } = await context.params;
  const rows = await sql`
    SELECT *
    FROM aur_blogs
    WHERE id = ${id} AND status = 'published'
    LIMIT 1
  `;
  return rows[0]
    ? Response.json(rows[0], {
        headers: { "Cache-Control": "public, s-maxage=300" },
      })
    : Response.json({ message: "Blog not found." }, { status: 404 });
}
