import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not configured.");
}

/**
 * Service account for verifying ID tokens and reading the admin custom claim.
 *
 * Supplied as inline JSON so the same value works on hosts without a writable
 * filesystem. When absent the SDK falls back to application default
 * credentials, which is what a local `gcloud auth` setup provides; without
 * either, every authenticated route fails with `app/invalid-credential`.
 */
function serviceAccountCredential() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!inline) return undefined;
  try {
    return cert(JSON.parse(inline));
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON. It must be the " +
        "service account key on a single line.",
    );
  }
}

const credential = serviceAccountCredential();
const app = getApps().length
  ? getApp()
  : initializeApp(credential ? { projectId, credential } : { projectId });

export const firebaseAdminAuth = getAuth(app);

export async function verifyFirebaseRequest(
  request: Request,
  options: { admin?: boolean } = {},
) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) {
    throw new Response("Authentication required", { status: 401 });
  }

  const decoded = await firebaseAdminAuth.verifyIdToken(token);
  if (options.admin && decoded.admin !== true) {
    throw new Response("Admin access required", { status: 403 });
  }
  return decoded;
}
