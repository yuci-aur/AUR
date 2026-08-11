import { verifyFirebaseRequest } from "@/app/lib/firebase-admin";
import { sql } from "@/app/lib/neon";

function tokenName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Institution logos and campus photos are rendered in the public listing, so
 * only accept the https URLs our own signed upload endpoint hands back. Any
 * other value (including javascript: and data: URLs) is stored as null.
 */
function mediaUrl(value: unknown) {
  const url = tokenName(value);
  if (!url) return null;
  return /^https:\/\/res\.cloudinary\.com\//i.test(url) ? url : null;
}

function errorResponse(error: unknown) {
  if (error instanceof Response) return error;
  // Without this the cause is invisible: the client maps any failure to a
  // generic notice, so an unlogged throw leaves nothing to diagnose from.
  console.error("[/api/account]", error);
  return Response.json(
    { message: "Your account information could not be updated." },
    { status: 500 },
  );
}

type FirestoreValue = {
  nullValue?: null;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  stringValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

function decodeFirestoreValue(value: FirestoreValue): unknown {
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("stringValue" in value) return value.stringValue;
  if ("arrayValue" in value) {
    return (value.arrayValue?.values ?? []).map(decodeFirestoreValue);
  }
  if ("mapValue" in value) {
    return decodeFirestoreFields(value.mapValue?.fields ?? {});
  }
  return null;
}

function decodeFirestoreFields(fields: Record<string, FirestoreValue>) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      decodeFirestoreValue(value),
    ]),
  );
}

async function readLegacyDocument(
  collectionName: string,
  uid: string,
  idToken: string,
) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId,
    )}/databases/(default)/documents/${collectionName}/${encodeURIComponent(uid)}`,
    { headers: { Authorization: `Bearer ${idToken}` } },
  );
  if (!response.ok) return null;
  const document = (await response.json()) as {
    fields?: Record<string, FirestoreValue>;
  };
  return decodeFirestoreFields(document.fields ?? {});
}

async function migrateLegacyAccount(
  request: Request,
  user: Awaited<ReturnType<typeof verifyFirebaseRequest>>,
) {
  const existing = await sql`
    SELECT 1 FROM aur_user_profiles WHERE firebase_uid = ${user.uid}
  `;
  if (existing.length > 0) return;

  const authorization = request.headers.get("authorization");
  const idToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  if (!idToken) return;

  const [profile, application] = await Promise.all([
    readLegacyDocument("userProfiles", user.uid, idToken),
    readLegacyDocument("institutionApplications", user.uid, idToken),
  ]);
  if (!profile) return;

  const accountType =
    profile.account_type === "institution" ? "institution" : "student";
  const profileRole =
    accountType === "institution"
      ? "Institution"
      : profile.profile_role === "Faculty"
        ? "Faculty"
        : "Student";
  await sql`
    INSERT INTO aur_user_profiles (
      firebase_uid, email, first_name, last_name, country, profile_role,
      profile_photo, account_type, institution_application_status
    )
    VALUES (
      ${user.uid}, ${String(user.email ?? profile.email ?? "")},
      ${String(profile.first_name ?? "AUR")},
      ${String(profile.last_name ?? "-")},
      ${String(profile.country ?? "")}, ${profileRole},
      ${typeof profile.profile_photo === "string" ? profile.profile_photo : null},
      ${accountType},
      ${String(profile.institution_application_status ?? "")}
    )
    ON CONFLICT (firebase_uid) DO NOTHING
  `;

  if (application && accountType === "institution") {
    const status = ["draft", "pending", "approved", "rejected"].includes(
      String(application.status),
    )
      ? String(application.status)
      : "pending";
    await sql`
      INSERT INTO aur_institution_applications (
        firebase_uid, institution_name, institution_type, country, website,
        accreditation_id, representative_name, representative_email,
        status, submitted_at, updated_at
      )
      VALUES (
        ${user.uid}, ${String(application.institutionName ?? "")},
        ${String(application.institutionType ?? "University")},
        ${String(application.country ?? "")},
        ${String(application.website ?? "")},
        ${String(application.accreditationId ?? "")},
        ${String(application.representativeName ?? "")},
        ${String(application.representativeEmail ?? user.email ?? "")},
        ${status},
        ${String(application.submittedAt ?? new Date().toISOString())},
        now()
      )
      ON CONFLICT (firebase_uid) DO NOTHING
    `;
  }
}

async function ensureProfile(
  user: Awaited<ReturnType<typeof verifyFirebaseRequest>>,
) {
  const displayName = tokenName(user.name);
  const names = displayName.split(/\s+/).filter(Boolean);
  await sql`
    INSERT INTO aur_user_profiles (
      firebase_uid, email, first_name, last_name, profile_photo
    )
    VALUES (
      ${user.uid}, ${String(user.email ?? "")},
      ${names[0] || "AUR"}, ${names.slice(1).join(" ") || "-"},
      ${typeof user.picture === "string" ? user.picture : null}
    )
    ON CONFLICT (firebase_uid) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = now()
  `;
}

export async function GET(request: Request) {
  try {
    const user = await verifyFirebaseRequest(request);
    await migrateLegacyAccount(request, user);
    await ensureProfile(user);
    const profiles = await sql`
      SELECT
        firebase_uid AS id, email, first_name, last_name, country,
        profile_role, profile_photo, account_type,
        institution_application_status
      FROM aur_user_profiles
      WHERE firebase_uid = ${user.uid}
      LIMIT 1
    `;
    const applications = await sql`
      SELECT
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
        submitted_at AS "submittedAt"
      FROM aur_institution_applications
      WHERE firebase_uid = ${user.uid}
      LIMIT 1
    `;
    return Response.json({
      profile: profiles[0] ?? null,
      institutionApplication: applications[0] ?? null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await verifyFirebaseRequest(request);
    await migrateLegacyAccount(request, user);
    await ensureProfile(user);
    const body = (await request.json()) as Record<string, unknown>;
    const names = tokenName(body.name).split(/\s+/).filter(Boolean);
    const role =
      body.profile_role === "Faculty" || body.profile_role === "Institution"
        ? body.profile_role
        : "Student";
    await sql`
      UPDATE aur_user_profiles
      SET
        first_name = ${names[0] || "AUR"},
        last_name = ${names.slice(1).join(" ") || "-"},
        country = ${tokenName(body.country)},
        profile_role = ${role},
        profile_photo = ${
          typeof body.profile_photo === "string" ? body.profile_photo : null
        },
        updated_at = now()
      WHERE firebase_uid = ${user.uid}
    `;
    return GET(request);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyFirebaseRequest(request);
    await migrateLegacyAccount(request, user);
    await ensureProfile(user);
    const body = (await request.json()) as Record<string, unknown>;
    const website = tokenName(body.website);
    if (!/^https?:\/\/.+/i.test(website)) {
      return Response.json(
        { message: "Enter the complete official website address." },
        { status: 400 },
      );
    }
    await sql`
      INSERT INTO aur_institution_applications (
        firebase_uid, institution_name, institution_type, country, website,
        accreditation_id, representative_name, representative_email,
        description, logo_url, campus_photo,
        status, submitted_at, updated_at
      )
      VALUES (
        ${user.uid}, ${tokenName(body.institutionName)},
        ${tokenName(body.institutionType)}, ${tokenName(body.country)},
        ${website}, ${tokenName(body.accreditationId)},
        ${tokenName(body.representativeName)}, ${String(user.email ?? "")},
        ${tokenName(body.description).slice(0, 2000)},
        ${mediaUrl(body.logoUrl)}, ${mediaUrl(body.campusPhoto)},
        'pending', now(), now()
      )
      ON CONFLICT (firebase_uid) DO UPDATE SET
        institution_name = EXCLUDED.institution_name,
        institution_type = EXCLUDED.institution_type,
        country = EXCLUDED.country,
        website = EXCLUDED.website,
        accreditation_id = EXCLUDED.accreditation_id,
        representative_name = EXCLUDED.representative_name,
        representative_email = EXCLUDED.representative_email,
        description = EXCLUDED.description,
        -- Keep the stored media when a resubmission omits a new upload.
        logo_url = COALESCE(EXCLUDED.logo_url, aur_institution_applications.logo_url),
        campus_photo = COALESCE(
          EXCLUDED.campus_photo, aur_institution_applications.campus_photo
        ),
        status = CASE
          WHEN aur_institution_applications.status = 'approved' THEN 'approved'
          ELSE 'pending'
        END,
        -- A resubmission supersedes the previous review, so the old feedback
        -- must not linger next to the new pending state.
        rejection_reason = NULL,
        updated_at = now()
    `;
    await sql`
      UPDATE aur_user_profiles
      SET
        account_type = 'institution',
        profile_role = 'Institution',
        institution_application_status = 'pending',
        updated_at = now()
      WHERE firebase_uid = ${user.uid}
    `;
    return Response.json({ success: true, status: "pending" });
  } catch (error) {
    return errorResponse(error);
  }
}
