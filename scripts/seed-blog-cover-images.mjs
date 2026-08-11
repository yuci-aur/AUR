/**
 * Assigns a stock cover image to published blog posts that have none.
 *
 * Covers are matched to the post's category so the lead card and grid read as
 * deliberate rather than decorative. Every URL is checked for reachability
 * before it is written, because a dead cover is worse than none: the blog UI
 * hides an empty cover cleanly, but a 404 URL makes next/image log repeated
 * upstream failures (which is what scripts/audit-blog-cover-images.mjs exists
 * to clean up afterwards).
 *
 * Dry run by default; pass --write to apply. Existing covers are never
 * overwritten unless --force is given.
 *
 *   node scripts/seed-blog-cover-images.mjs
 *   node scripts/seed-blog-cover-images.mjs --write
 *   node scripts/seed-blog-cover-images.mjs --write --force
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

const shouldWrite = process.argv.includes("--write");
const shouldForce = process.argv.includes("--force");
const sql = neon(databaseUrl);

// next.config.ts only allows images.unsplash.com among remote hosts, so the
// covers have to come from there to survive the next/image loader.
const RENDITION = "?auto=format&fit=crop&w=1200&q=70";

const COVERS_BY_CATEGORY = {
  "Guidance": "photo-1454165804606-c3d57bc86b40",
  "Research": "photo-1532094349884-543bc11b234d",
  "Student Outcomes": "photo-1541339907198-e08756dedf3f",
  "Global Engagement": "photo-1526778548025-fa2f459cd5c1",
  "Teaching & Learning": "photo-1524178232363-1fb2b075b655",
  "Sustainability": "photo-1441974231531-c6227db76b6e",
  "Ranking Insights": "photo-1551288049-bebda4e38f71",
  "Featured Insight": "photo-1523240795612-9a054b0db644",
};

// Used when a post's category has no dedicated cover, so a new category never
// leaves the lead card with an empty panel.
const FALLBACK_COVER = "photo-1523580494863-6f3031224c94";

function coverFor(category) {
  const id = COVERS_BY_CATEGORY[category] ?? FALLBACK_COVER;
  return `https://images.unsplash.com/${id}${RENDITION}`;
}

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

const rows = await sql`
  SELECT id, title, category, cover_image
  FROM aur_blogs
  ORDER BY created_at DESC
`;

const targets = rows.filter(
  (row) => shouldForce || !row.cover_image || row.cover_image === "",
);

console.log(
  `${rows.length} blog post(s); ${targets.length} without a cover image.\n`,
);

if (targets.length === 0) {
  console.log("Nothing to do.");
  process.exit(0);
}

const planned = [];
for (const row of targets) {
  const url = coverFor(row.category);
  const ok = await isReachable(url);
  console.log(
    `  ${ok ? "OK   " : "DEAD "} ${String(row.category ?? "-").padEnd(20)} ${String(row.title).slice(0, 42)}`,
  );
  if (ok) planned.push({ ...row, url });
}

const dead = targets.length - planned.length;
if (dead > 0) {
  console.log(`\n${dead} cover(s) unreachable and will be skipped.`);
}

if (!shouldWrite) {
  console.log(`\nDry run. Re-run with --write to apply ${planned.length} update(s).`);
  process.exit(0);
}

for (const row of planned) {
  await sql`
    UPDATE aur_blogs
    SET cover_image = ${row.url}, updated_at = now()
    WHERE id = ${row.id}
  `;
  console.log(`  set cover for "${String(row.title).slice(0, 50)}"`);
}

console.log(`\nUpdated ${planned.length} cover image(s).`);
