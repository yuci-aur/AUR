/**
 * Reports blog cover images that no longer resolve.
 *
 * Read-only by default. Pass --fix to clear the `cover_image` of any row whose
 * URL does not return a successful response; the blog UI already hides the
 * cover when it is empty, so clearing is safe and removes the repeated
 * `upstream image response failed` 404s from the next/image proxy.
 *
 *   node scripts/audit-blog-cover-images.mjs
 *   node scripts/audit-blog-cover-images.mjs --fix
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { neon } from "@neondatabase/serverless";

function loadLocalEnvironment() {
  const environmentPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(environmentPath)) return;
  const contents = fs.readFileSync(environmentPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
  }
}

loadLocalEnvironment();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not configured (checked env and .env.local).");
  process.exit(1);
}

const shouldFix = process.argv.includes("--fix");
const sql = neon(databaseUrl);

async function isReachable(url) {
  // Some CDNs reject HEAD, so fall back to a ranged GET before declaring dead.
  try {
    const head = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (head.ok) return true;
    if (head.status !== 405 && head.status !== 403) return false;
  } catch {
    return false;
  }
  try {
    const get = await fetch(url, {
      headers: { Range: "bytes=0-0" },
      redirect: "follow",
    });
    return get.ok;
  } catch {
    return false;
  }
}

// aur_blogs.id is a text primary key (see database/schema.sql), not a uuid.
const rows = await sql`
  SELECT id, title, cover_image
  FROM aur_blogs
  WHERE cover_image IS NOT NULL AND cover_image <> ''
  ORDER BY created_at DESC
`;

console.log(`Checking ${rows.length} blog cover image(s)…\n`);

const broken = [];
for (const row of rows) {
  const ok = await isReachable(row.cover_image);
  console.log(
    `  ${ok ? "OK   " : "DEAD "} ${String(row.title).slice(0, 46).padEnd(48)} ${row.cover_image}`,
  );
  if (!ok) broken.push(row);
}

console.log(`\n${broken.length} of ${rows.length} cover image(s) unreachable.`);

if (broken.length === 0) process.exit(0);

if (!shouldFix) {
  console.log("\nRe-run with --fix to clear the unreachable cover images.");
  process.exit(0);
}

for (const row of broken) {
  await sql`
    UPDATE aur_blogs
    SET cover_image = NULL, updated_at = now()
    WHERE id = ${row.id}
  `;
  console.log(`  cleared cover_image for "${row.title}"`);
}

console.log(`\nCleared ${broken.length} cover image(s).`);
