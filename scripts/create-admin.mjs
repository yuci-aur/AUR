/**
 * Creates (or updates) an AUR admin account in Firebase Authentication and
 * grants it the `admin: true` custom claim that every admin API route checks.
 *
 * Usage:
 *   node scripts/create-admin.mjs <email> <password>
 *
 * Requires a Firebase service account, read from .env.local as either:
 *   FIREBASE_SERVICE_ACCOUNT      — the service account JSON on a single line
 *   GOOGLE_APPLICATION_CREDENTIALS — path to the downloaded .json key file
 *
 * Get one at: Firebase Console → Project Settings → Service Accounts →
 * "Generate new private key". Treat it as a secret; it grants full project
 * access and must never be committed.
 */

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password>");
  process.exit(1);
}

// Load .env.local by hand: this runs outside Next.js, which normally does it.
const env = {};
try {
  for (const line of readFileSync(
    new URL("../.env.local", import.meta.url),
    "utf8",
  ).split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {
  console.error("Could not read .env.local next to the project root.");
  process.exit(1);
}

function loadServiceAccount() {
  const inline = env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) {
    try {
      return JSON.parse(inline);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON.");
    }
  }
  const path = env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) {
    try {
      return JSON.parse(readFileSync(path, "utf8"));
    } catch {
      throw new Error(`Could not read the key file at ${path}`);
    }
  }
  throw new Error(
    "No service account found. Add FIREBASE_SERVICE_ACCOUNT (the key JSON on\n" +
      "one line) or GOOGLE_APPLICATION_CREDENTIALS (path to the .json file) to\n" +
      ".env.local. Download one from the Firebase Console:\n" +
      "  Project Settings → Service Accounts → Generate new private key\n" +
      "Never commit this key — it grants full access to the project.",
  );
}

let serviceAccount;
try {
  serviceAccount = loadServiceAccount();
} catch (error) {
  console.error(`\n${error.message}\n`);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const auth = getAuth();

// Reuse the account when it already exists so this script is safe to re-run.
let user;
try {
  user = await auth.getUserByEmail(email);
  console.log(`Existing account found for ${email} (${user.uid})`);
  await auth.updateUser(user.uid, { password, emailVerified: true });
  console.log("Password updated.");
} catch (error) {
  if (error.code !== "auth/user-not-found") throw error;
  user = await auth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: "AUR Admin",
  });
  console.log(`Created account ${email} (${user.uid})`);
}

await auth.setCustomUserClaims(user.uid, { admin: true });

const check = await auth.getUser(user.uid);
if (check.customClaims?.admin !== true) {
  console.error("The admin claim did not persist. Aborting.");
  process.exit(1);
}

console.log(`Admin claim set for ${email}.`);
console.log("\nSign in at /admin/login.");
console.log(
  "If this account was already signed in somewhere, sign out and back in —\n" +
    "the admin claim only reaches the client on a fresh ID token.",
);
