import "server-only";

import { getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not configured.");
}

const app = getApps().length ? getApp() : initializeApp({ projectId });

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
