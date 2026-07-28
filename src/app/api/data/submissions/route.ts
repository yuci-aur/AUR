import { randomUUID } from "node:crypto";

import { verifyFirebaseRequest } from "@/app/lib/firebase-admin";
import { sql } from "@/app/lib/neon";

function errorResponse(error: unknown) {
  if (error instanceof Response) return error;
  return Response.json(
    { message: "The request could not be completed." },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || Array.isArray(body)) {
      return Response.json({ message: "Invalid request." }, { status: 400 });
    }
    const type = String(body.type ?? "");

    if (type === "newsletter") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Response.json(
          { message: "Enter a valid email address." },
          { status: 400 },
        );
      }
      await sql`
        INSERT INTO aur_newsletter_subscribers (email, active, subscribed_at)
        VALUES (${email}, true, now())
        ON CONFLICT (email) DO UPDATE SET active = true
      `;
      return Response.json({ success: true });
    }

    const user = await verifyFirebaseRequest(request);
    if (type === "application") {
      const id = randomUUID();
      await sql`
        INSERT INTO aur_applications (
          id, firebase_uid, event_id, university_id, documents,
          status, submitted_at, data
        )
        VALUES (
          ${id}, ${user.uid}, ${String(body.eventId ?? "")},
          ${String(body.universityId ?? "")},
          ${JSON.stringify(body.documents ?? [])}::jsonb,
          'submitted', now(), ${JSON.stringify(body)}::jsonb
        )
      `;
      return Response.json({ id });
    }

    if (type === "nomination") {
      const id = randomUUID();
      await sql`
        INSERT INTO aur_nominations (
          id, firebase_uid, status, submitted_at, data
        )
        VALUES (
          ${id}, ${user.uid}, 'pending_review', now(),
          ${JSON.stringify(body.payload ?? {})}::jsonb
        )
      `;
      return Response.json({ id });
    }

    return Response.json({ message: "Unknown submission type." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
