import { verifyFirebaseRequest } from "@/app/lib/firebase-admin";
import { sql } from "@/app/lib/neon";

// firebase-admin is not edge-compatible, so pin the runtime rather than leaving
// it to inference.
export const runtime = "nodejs";

function errorResponse(error: unknown) {
  if (error instanceof Response) return error;
  console.error("[/api/account/bookmarks]", error);
  return Response.json({ message: "Bookmark request failed." }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const user = await verifyFirebaseRequest(request);
    const rows = await sql`
      SELECT university_id
      FROM aur_bookmarks
      WHERE firebase_uid = ${user.uid}
      ORDER BY created_at DESC
    `;
    return Response.json(rows.map((row) => String(row.university_id)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyFirebaseRequest(request);
    const body = (await request.json()) as { universityId?: string };
    if (!body.universityId) {
      return Response.json({ message: "University is required." }, { status: 400 });
    }
    await sql`
      INSERT INTO aur_user_profiles (firebase_uid, email, display_name)
      VALUES (${user.uid}, ${user.email ?? null}, ${user.name ?? null})
      ON CONFLICT (firebase_uid) DO NOTHING
    `;
    await sql`
      INSERT INTO aur_bookmarks (firebase_uid, university_id)
      VALUES (${user.uid}, ${body.universityId})
      ON CONFLICT DO NOTHING
    `;
    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await verifyFirebaseRequest(request);
    const universityId = new URL(request.url).searchParams.get("universityId");
    if (!universityId) {
      return Response.json({ message: "University is required." }, { status: 400 });
    }
    await sql`
      DELETE FROM aur_bookmarks
      WHERE firebase_uid = ${user.uid} AND university_id = ${universityId}
    `;
    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
