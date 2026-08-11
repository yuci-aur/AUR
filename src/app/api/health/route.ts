import "server-only";

/**
 * Deployment diagnostics.
 *
 * The account routes fail closed with a generic message, and Next strips error
 * detail from production responses, so a misconfigured environment is invisible
 * from the browser. This reports presence and shape of each server secret —
 * never a value — plus the result of a live Firebase Admin call.
 *
 * Safe to leave deployed: every field is a boolean, a length, or a prefix.
 */
export const dynamic = "force-dynamic";

function describe(name: string) {
  const value = process.env[name];
  return {
    set: Boolean(value),
    length: value?.length ?? 0,
  };
}

export async function GET() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY ?? "";

  const env = {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: {
      ...describe("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
      value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null,
    },
    FIREBASE_CLIENT_EMAIL: describe("FIREBASE_CLIENT_EMAIL"),
    FIREBASE_PRIVATE_KEY: {
      ...describe("FIREBASE_PRIVATE_KEY"),
      // The usual failure is a key whose \n escapes were turned into real
      // newlines, or one wrapped in stray quotes by a dashboard paste.
      startsWithHeader: privateKey.startsWith("-----BEGIN"),
      hasEscapedNewlines: privateKey.includes("\\n"),
      hasRealNewlines: privateKey.includes("\n"),
      isQuoted: privateKey.startsWith('"') || privateKey.startsWith("'"),
    },
    FIREBASE_SERVICE_ACCOUNT: describe("FIREBASE_SERVICE_ACCOUNT"),
    DATABASE_URL: describe("DATABASE_URL"),
  };

  const checks: Record<string, string> = {};

  try {
    const { firebaseAdminAuth } = await import("@/app/lib/firebase-admin");
    await firebaseAdminAuth.listUsers(1);
    checks.firebaseAdmin = "ok";
  } catch (error) {
    checks.firebaseAdmin =
      error instanceof Error
        ? `${(error as { code?: string }).code ?? "error"}: ${error.message}`
        : String(error);
  }

  try {
    const { sql } = await import("@/app/lib/neon");
    await sql`SELECT 1`;
    checks.database = "ok";
  } catch (error) {
    checks.database = error instanceof Error ? error.message : String(error);
  }

  const ok = Object.values(checks).every((result) => result === "ok");
  return Response.json({ ok, env, checks }, { status: ok ? 200 : 503 });
}
