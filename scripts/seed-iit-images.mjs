/**
 * Attaches campus photography to the IIT rows created by seed-iits.mjs.
 *
 * Those rows were inserted with null images, which renders as an empty grey
 * card header in the directory.
 *
 * LOGOS ARE DELIBERATELY NOT SET. The IIT logos on Wikipedia are non-free files
 * hosted locally at upload.wikimedia.org/wikipedia/en/ under a fair-use
 * rationale that covers the encyclopedia article only — not a third-party
 * commercial site. Only freely-licensed Commons photographs
 * (upload.wikimedia.org/wikipedia/commons/) are written here. UniversityCard
 * guards the logo with `uni.logo && (...)`, so a null logo renders cleanly.
 * Add official logos later from the institutions or via Cloudinary.
 *
 * The site's CSP allows `img-src https:` and university cards use plain <img>
 * rather than next/image, so upload.wikimedia.org needs no entry in
 * next.config.ts remotePatterns. Anything later switched to next/image would.
 *
 * Each URL was resolved through the MediaWiki imageinfo API and is verified
 * reachable before writing — a dead URL renders as a broken image, which is
 * worse than the empty state the card already handles.
 *
 * Dry run by default; pass --write to apply.
 *
 *   node scripts/seed-iit-images.mjs
 *   node scripts/seed-iit-images.mjs --write
 *   node scripts/seed-iit-images.mjs --write --force
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { neon } from "@neondatabase/serverless";

function loadLocalEnvironment() {
  const environmentPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(environmentPath)) return;
  for (const line of fs.readFileSync(environmentPath, "utf8").split(/\r?\n/)) {
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

/**
 * Campus photographs from Wikimedia Commons, keyed by the slug written by
 * seed-iits.mjs. Each file was hand-checked to be the institute's own campus —
 * an automated pick pulled in unrelated images (wildlife, portraits of
 * visiting officials, student-club logos) from the same articles.
 *
 * Guwahati, Jodhpur, Goa and Jammu are absent: their articles carry no freely
 * licensed campus photograph. They render with the card's empty-image state.
 */
const CAMPUS_PHOTOS = {
  "indian-institute-of-technology-delhi-india":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/IIT_Delhi_Main_Building.jpeg/1280px-IIT_Delhi_Main_Building.jpeg",
  "indian-institute-of-technology-bombay-india":
    "https://upload.wikimedia.org/wikipedia/commons/2/2e/IITBMainBuildingCROP.jpg",
  "indian-institute-of-technology-madras-india":
    "https://upload.wikimedia.org/wikipedia/commons/d/d4/IIT_Madras_Campus.jpg",
  "indian-institute-of-technology-kharagpur-india":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Bubai_Manna_%28IIT_Kharagpur_main_building%29.jpg/1280px-Bubai_Manna_%28IIT_Kharagpur_main_building%29.jpg",
  "indian-institute-of-technology-kanpur-india":
    "https://upload.wikimedia.org/wikipedia/commons/0/03/IITKLibrary.jpg",
  "indian-institute-of-technology-roorkee-india":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Admin_Block_IIT-R.JPG/1280px-Admin_Block_IIT-R.JPG",
  "indian-institute-of-technology-indore-india":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Entrance_of_IIT_Indore.jpg/1280px-Entrance_of_IIT_Indore.jpg",
  "indian-institute-of-technology-bhu-varanasi-india":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/IIT_BHU_Varanasi.jpg/1280px-IIT_BHU_Varanasi.jpg",
  "indian-institute-of-technology-hyderabad-india":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/IIT%28Hyderabad%29.jpg/1280px-IIT%28Hyderabad%29.jpg",
  "indian-institute-of-technology-ism-dhanbad-india":
    "https://upload.wikimedia.org/wikipedia/commons/f/fe/Diamond_Hostel_at_IIT_Dhanbad.jpg",
  "indian-institute-of-technology-gandhinagar-india":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Entrance_Close_Guest_House_IITGN_Gujarat_Sep25_A7CR_07901.jpg/1280px-Entrance_Close_Guest_House_IITGN_Gujarat_Sep25_A7CR_07901.jpg",
  "indian-institute-of-technology-patna-india":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/IIT-Patna-Campus.png/1280px-IIT-Patna-Campus.png",
  "indian-institute-of-technology-ropar-india":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/IIT_Ropar_-_Main_Building_of_the_Transit_Campus.JPG/1280px-IIT_Ropar_-_Main_Building_of_the_Transit_Campus.JPG",
  "indian-institute-of-technology-mandi-india":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/IIT_Mandi_Campus_from_Griffon_Peak_Jan_2020_D72_13785.jpg/1280px-IIT_Mandi_Campus_from_Griffon_Peak_Jan_2020_D72_13785.jpg",
  "indian-institute-of-technology-bhubaneswar-india":
    "https://upload.wikimedia.org/wikipedia/commons/c/c7/Main_Gate_of_iitbbs.jpg",
  "indian-institute-of-technology-tirupati-india":
    "https://upload.wikimedia.org/wikipedia/commons/1/18/Administration_Building%2C_IITT.jpg",
  "indian-institute-of-technology-palakkad-india":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Academic_Block_Temporary_Campus.jpg/1280px-Academic_Block_Temporary_Campus.jpg",
  "indian-institute-of-technology-bhilai-india":
    "https://upload.wikimedia.org/wikipedia/commons/f/f0/IITBH_Permanent_Campus_Construction.png",
  "indian-institute-of-technology-dharwad-india":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Indian_Institute_of_Technology_Dharwad_01.jpg/1280px-Indian_Institute_of_Technology_Dharwad_01.jpg",
};

// Wikimedia rejects requests without a descriptive User-Agent.
const REQUEST_HEADERS = {
  "User-Agent": "AUR-directory-seed/1.0 (+https://asiauniversityrankings.com)",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function probe(url) {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: REQUEST_HEADERS,
    });
    if (head.ok) return true;
    // Some CDNs refuse HEAD; confirm with a ranged GET before judging.
    if (head.status !== 405 && head.status !== 403) return false;
  } catch {
    return false;
  }
  try {
    const get = await fetch(url, {
      headers: { ...REQUEST_HEADERS, Range: "bytes=0-0" },
      redirect: "follow",
    });
    return get.ok;
  } catch {
    return false;
  }
}

/**
 * Wikimedia throttles rapid sequential requests, and a throttled response is
 * indistinguishable from a dead link on a single try — an unretried check
 * discarded 7 of 19 perfectly valid images. Retries with a widening pause
 * before concluding a URL is actually dead.
 */
async function isReachable(url) {
  if (!url) return false;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (await probe(url)) return true;
    await sleep(500 * (attempt + 1));
  }
  return false;
}

const rows = await sql`
  SELECT id, name,
         data->>'slug' AS slug,
         data->>'campusPhoto' AS campus_photo
  FROM aur_universities
  WHERE name ILIKE '%indian institute of technology%'
  ORDER BY name
`;

console.log(`${rows.length} IIT row(s) in the directory.\n`);

const planned = [];
for (const row of rows) {
  const url = CAMPUS_PHOTOS[row.slug];

  if (!url) {
    console.log(`  SKIP   no free photo available   ${row.name}`);
    continue;
  }
  if (row.campus_photo && !shouldForce) {
    console.log(`  KEEP   already has a photo        ${row.name}`);
    continue;
  }

  const ok = await isReachable(url);
  console.log(`  ${ok ? "OK  " : "DEAD"}   ${row.name}`);
  if (ok) planned.push({ id: row.id, name: row.name, url });
  // Courtesy pause so a 19-image sweep does not read as abuse to Wikimedia.
  await sleep(250);
}

if (!shouldWrite) {
  console.log(`\nDry run. Re-run with --write to apply ${planned.length} update(s).`);
  process.exit(0);
}

for (const row of planned) {
  // Both the camelCase and snake_case keys are kept in sync: rows migrated from
  // Firestore carry both spellings and different consumers read either one.
  await sql`
    UPDATE aur_universities
    SET data = data || jsonb_build_object(
                 'campusPhoto',  ${row.url}::text,
                 'campus_photo', ${row.url}::text
               ),
        updated_at = now()
    WHERE id = ${row.id}
  `;
  console.log(`  set photo for ${row.name}`);
}

console.log(`\nUpdated ${planned.length} row(s).`);
