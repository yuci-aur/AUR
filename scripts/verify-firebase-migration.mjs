import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = "aur-web-db";
const expectedCloud = "hi5oqvaq";

function firebaseCliCredentialData() {
  const candidates = [
    path.join(os.homedir(), ".config", "configstore", "firebase-tools.json"),
    path.join(process.env.APPDATA ?? "", "configstore", "firebase-tools.json"),
  ];
  const configPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!configPath) throw new Error("Firebase CLI credential store was not found.");
  const cliConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const cliRoot = path.join(process.env.APPDATA, "npm", "node_modules", "firebase-tools");
  const require = createRequire(import.meta.url);
  const cliApi = require(path.join(cliRoot, "lib", "api.js"));
  return {
    client_id: cliApi.clientId(),
    client_secret: cliApi.clientSecret(),
    refresh_token: cliConfig.tokens?.refresh_token,
    type: "authorized_user",
  };
}

async function pooled(values, concurrency, task) {
  const results = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (cursor < values.length) {
        const index = cursor++;
        results[index] = await task(values[index]);
      }
    }),
  );
  return results;
}

const credentialPath = path.join(os.tmpdir(), `aur-firebase-verify-${process.pid}.json`);
fs.writeFileSync(credentialPath, JSON.stringify(firebaseCliCredentialData()), { mode: 0o600 });
process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialPath;

try {
  const app = initializeApp({ credential: applicationDefault(), projectId });
  const db = getFirestore(app);
  const auth = getAuth(app);
  const collections = [
    "universities",
    "rankings",
    "events",
    "blogs",
    "methodologyVersions",
    "newsItems",
    "notifications",
    "adminProfiles",
    "userProfiles",
  ];
  const snapshots = await Promise.all(
    collections.map((name) => db.collection(name).get()),
  );
  const counts = Object.fromEntries(
    snapshots.map((snapshot, index) => [collections[index], snapshot.size]),
  );

  const authUsers = await auth.listUsers(1000);
  const nonAdminUsers = authUsers.users.filter(
    (user) => user.customClaims?.admin !== true,
  );

  const universities = snapshots[0].docs.map((document) => document.data());
  const blogs = snapshots[3].docs.map((document) => document.data());
  const urls = [
    ...universities.flatMap((university) => [
      university.logoUrl,
      university.campusPhoto,
    ]),
    ...blogs.map((blog) => blog.cover_image),
  ].filter((value) => typeof value === "string" && value.length > 0);

  const wrongCloud = urls.filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname !== "res.cloudinary.com"
        || !parsed.pathname.startsWith(`/${expectedCloud}/`);
    } catch {
      return true;
    }
  });
  const reachable = await pooled(urls, 24, async (url) => {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(12_000),
      });
      return response.ok;
    } catch {
      return false;
    }
  });
  const broken = urls.filter((_, index) => !reachable[index]);

  const report = {
    counts,
    firebaseAuthAccounts: authUsers.users.length,
    firebaseAdminEmails: authUsers.users
      .filter((user) => user.customClaims?.admin === true)
      .map((user) => user.email),
    firebaseAuthNonAdminAccounts: nonAdminUsers.length,
    cloudinaryUrlsChecked: urls.length,
    wrongCloudinaryAccountUrls: wrongCloud.length,
    unreachableCloudinaryUrls: broken.length,
  };
  console.log(JSON.stringify(report, null, 2));

  if (
    counts.universities !== 971
    || counts.rankings !== 971
    || counts.events !== 12
    || counts.blogs !== 8
    || counts.adminProfiles !== 1
    || counts.userProfiles !== 0
    || authUsers.users.length !== 1
    || nonAdminUsers.length !== 0
    || wrongCloud.length
    || broken.length
  ) {
    process.exitCode = 1;
  }
} finally {
  fs.rmSync(credentialPath, { force: true });
}
