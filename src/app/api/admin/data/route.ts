import { randomUUID } from "node:crypto";

import { verifyFirebaseRequest } from "@/app/lib/firebase-admin";
import { sql } from "@/app/lib/neon";

// firebase-admin is not edge-compatible, so pin the runtime rather than leaving
// it to inference.
export const runtime = "nodejs";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function errorResponse(error: unknown) {
  if (error instanceof Response) return error;
  return Response.json(
    { message: "The admin request could not be completed." },
    { status: 500 },
  );
}

async function ensureAdmin(
  user: Awaited<ReturnType<typeof verifyFirebaseRequest>>,
) {
  const displayName = typeof user.name === "string" ? user.name.trim() : "";
  const names = displayName.split(/\s+/).filter(Boolean);
  await sql`
    INSERT INTO aur_admin_profiles (
      firebase_uid, email, first_name, last_name, role
    )
    VALUES (
      ${user.uid}, ${String(user.email ?? "")},
      ${names[0] || "AUR"}, ${names.slice(1).join(" ") || "Admin"}, 'admin'
    )
    ON CONFLICT (firebase_uid) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = now()
  `;
}

export async function GET(request: Request) {
  try {
    const user = await verifyFirebaseRequest(request, { admin: true });
    await ensureAdmin(user);
    const action = new URL(request.url).searchParams.get("action");

    if (action === "verify") {
      const rows = await sql`
        SELECT
          firebase_uid AS id, first_name, last_name, email, role
        FROM aur_admin_profiles
        WHERE firebase_uid = ${user.uid}
      `;
      return Response.json(rows[0]);
    }

    if (action === "stats") {
      const rows = await sql`
        SELECT
          (
            (SELECT count(*) FROM aur_user_profiles) +
            (SELECT count(*) FROM aur_admin_profiles)
          )::int AS total_users,
          (SELECT count(*) FROM aur_admin_profiles)::int AS total_admins,
          (SELECT count(*) FROM aur_universities)::int AS total_universities,
          (SELECT count(*) FROM aur_blogs)::int AS total_blogs,
          (SELECT count(*) FROM aur_blogs WHERE status = 'published')::int
            AS published_blogs,
          (SELECT count(*) FROM aur_events)::int AS total_events,
          (SELECT count(*) FROM aur_applications)::int AS total_applications,
          (SELECT count(*) FROM aur_newsletter_subscribers)::int
            AS newsletter_subscribers
      `;
      return Response.json(rows[0]);
    }

    if (action === "users") {
      const rows = await sql`
        SELECT
          firebase_uid AS id, first_name, last_name, email, role,
          NULL::text AS oauth_provider, created_at
        FROM aur_admin_profiles
        ORDER BY created_at DESC
      `;
      return Response.json({ total: rows.length, data: rows });
    }

    if (action === "institution-applications") {
      const status = new URL(request.url).searchParams.get("status") ?? "";
      const filter = ["draft", "pending", "approved", "rejected"].includes(status)
        ? status
        : null;
      const rows = await sql`
        SELECT
          firebase_uid AS id,
          institution_name AS "institutionName",
          institution_type AS "institutionType",
          country,
          website,
          accreditation_id AS "accreditationId",
          representative_name AS "representativeName",
          representative_email AS "representativeEmail",
          description,
          logo_url AS "logoUrl",
          campus_photo AS "campusPhoto",
          status,
          rejection_reason AS "rejectionReason",
          reviewed_at AS "reviewedAt",
          reviewed_by AS "reviewedBy",
          submitted_at AS "submittedAt"
        FROM aur_institution_applications
        WHERE ${filter}::text IS NULL OR status = ${filter}
        ORDER BY
          CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
          submitted_at DESC
      `;
      return Response.json({ total: rows.length, data: rows });
    }

    if (action === "blogs") {
      return Response.json(
        await sql`SELECT * FROM aur_blogs ORDER BY created_at DESC`,
      );
    }

    if (action === "events") {
      return Response.json(
        await sql`SELECT * FROM aur_events ORDER BY created_at ASC`,
      );
    }

    return Response.json({ message: "Unknown admin action." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyFirebaseRequest(request, { admin: true });
    await ensureAdmin(user);
    const body = (await request.json()) as {
      action?: string;
      id?: string;
      payload?: Record<string, unknown>;
    };
    const payload = body.payload ?? {};
    const action = body.action;

    if (action === "create-blog" || action === "update-blog") {
      const id = action === "create-blog" ? randomUUID() : String(body.id ?? "");
      const now = new Date().toISOString();
      await sql`
        INSERT INTO aur_blogs (
          id, title, slug, category, status, description, content, cover_image,
          author, read_time, tags, featured, publish_date, created_at, updated_at
        )
        VALUES (
          ${id}, ${String(payload.title ?? "")},
          ${slugify(String(payload.title ?? ""))},
          ${String(payload.category ?? "")},
          ${String(payload.status ?? "draft").toLowerCase()},
          ${String(payload.description ?? "")}, ${String(payload.content ?? "")},
          ${payload.cover_image ? String(payload.cover_image) : null},
          ${payload.author ? String(payload.author) : null},
          ${payload.read_time ? String(payload.read_time) : null},
          ${payload.tags ? String(payload.tags) : null},
          ${Boolean(payload.featured)},
          ${payload.publish_date ? String(payload.publish_date) : null},
          ${now}, ${now}
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          category = EXCLUDED.category,
          status = EXCLUDED.status,
          description = EXCLUDED.description,
          content = EXCLUDED.content,
          cover_image = EXCLUDED.cover_image,
          author = EXCLUDED.author,
          read_time = EXCLUDED.read_time,
          tags = EXCLUDED.tags,
          featured = EXCLUDED.featured,
          publish_date = EXCLUDED.publish_date,
          updated_at = now()
      `;
      const rows = await sql`SELECT * FROM aur_blogs WHERE id = ${id}`;
      return Response.json(rows[0]);
    }

    if (action === "delete-blog") {
      await sql`DELETE FROM aur_blogs WHERE id = ${String(body.id ?? "")}`;
      return Response.json({ success: true });
    }

    if (action === "create-event" || action === "update-event") {
      const id = action === "create-event" ? randomUUID() : String(body.id ?? "");
      const now = new Date().toISOString();
      const type = payload.type === "award" ? "award" : "event";
      const status = ["open", "closed", "archived"].includes(
        String(payload.status),
      )
        ? String(payload.status)
        : "open";
      await sql`
        INSERT INTO aur_events (
          id, title, description, type, eligibility_criteria,
          status, created_at, updated_at
        )
        VALUES (
          ${id}, ${String(payload.title ?? "")},
          ${payload.description ? String(payload.description) : null},
          ${type},
          ${
            payload.eligibility_criteria
              ? String(payload.eligibility_criteria)
              : null
          },
          ${status}, ${now}, ${now}
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          type = EXCLUDED.type,
          eligibility_criteria = EXCLUDED.eligibility_criteria,
          status = EXCLUDED.status,
          updated_at = now()
      `;
      const rows = await sql`SELECT * FROM aur_events WHERE id = ${id}`;
      return Response.json(rows[0]);
    }

    if (action === "delete-event") {
      await sql`DELETE FROM aur_events WHERE id = ${String(body.id ?? "")}`;
      return Response.json({ success: true });
    }

    if (
      action === "approve-institution" ||
      action === "reject-institution" ||
      action === "unpublish-institution"
    ) {
      const targetUid = String(body.id ?? "");
      if (!targetUid) {
        return Response.json(
          { message: "An institution application id is required." },
          { status: 400 },
        );
      }
      // Unpublishing returns an approved listing to the review queue: it leaves
      // the public directory but keeps every submitted detail for re-approval.
      const status =
        action === "approve-institution"
          ? "approved"
          : action === "reject-institution"
            ? "rejected"
            : "pending";
      const reason =
        action === "reject-institution"
          ? String(payload.reason ?? "").trim().slice(0, 500) || null
          : null;

      const updated = await sql`
        UPDATE aur_institution_applications
        SET
          status = ${status},
          rejection_reason = ${reason},
          reviewed_at = now(),
          reviewed_by = ${String(user.email ?? user.uid)},
          updated_at = now()
        WHERE firebase_uid = ${targetUid}
        RETURNING firebase_uid
      `;
      if (updated.length === 0) {
        return Response.json(
          { message: "That institution application no longer exists." },
          { status: 404 },
        );
      }

      // The applicant's profile mirrors this status, so keep the two in step.
      await sql`
        UPDATE aur_user_profiles
        SET institution_application_status = ${status}, updated_at = now()
        WHERE firebase_uid = ${targetUid}
      `;
      return Response.json({ success: true, status });
    }

    if (action === "create-university") {
      const id = randomUUID();
      const name = String(payload.name ?? "");
      const overall = Number(payload.ranking_score);
      const data = {
        id,
        slug: slugify(name),
        name,
        registration_code: String(payload.registration_code ?? ""),
        description: String(payload.description ?? ""),
        location: String(payload.country ?? ""),
        country: String(payload.country ?? ""),
        subregion: String(payload.subregion ?? ""),
        state: payload.state ?? null,
        city: payload.city ?? null,
        size: String(payload.size ?? ""),
        focus: String(payload.focus ?? ""),
        research: String(payload.research_level ?? ""),
        research_level: payload.research_level ?? null,
        isPublic: payload.is_public ?? true,
        established_year: payload.established_year ?? null,
        total_students: payload.total_students ?? null,
        total_faculty: payload.total_faculty ?? null,
        avg_fees: payload.avg_fees ?? null,
        tuition: payload.avg_fees ?? null,
        placement_percentage: payload.placement_percentage ?? null,
        website: payload.website_url ?? null,
        logoUrl: payload.logo_url ?? null,
        campusPhoto: payload.campus_photo ?? null,
        hasMedicine: payload.has_medicine ?? false,
        hasScholarship: payload.has_scholarship ?? false,
        overall: Number.isFinite(overall) ? overall : null,
        subjects: [],
        languages: [],
        programs: [],
      };
      await sql`
        INSERT INTO aur_universities (id, name, location, overall, data)
        VALUES (
          ${id}, ${name}, ${String(payload.country ?? "")},
          ${Number.isFinite(overall) ? overall : null},
          ${JSON.stringify(data)}::jsonb
        )
      `;
      return Response.json({ status: "success", university_id: id });
    }

    return Response.json({ message: "Unknown admin action." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
