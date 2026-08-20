/**
 * Seeds the Indian Institutes of Technology into `aur_universities`.
 *
 * The IITs were absent from the migrated dataset, so searching "IIT" returned
 * nothing (the sole hit was Sri Lanka Institute of Information Technology,
 * matched on the letters in "SLIIT").
 *
 * `rank` holds the published QS World University Rankings 2026 position.
 *
 * `overall` is DERIVED from that QS rank (see `deriveOverall`), not supplied by
 * AUR. It exists so the IITs sort near their true standing in the directory
 * instead of falling below every scored row. The curve is interpolated from the
 * median `overall` of the 303 existing rows that carry both values, so the
 * numbers sit in the same range as their neighbours — but they are estimates.
 * Replace them when real AUR composites are calculated.
 *
 * Re-runnable: rows are matched on `slug`, so a second run updates in place
 * rather than creating duplicates.
 *
 * Usage: node scripts/seed-iits.mjs [--dry-run]
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const dryRun = process.argv.includes("--dry-run");

if (!process.env.DATABASE_URL) {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // Fall through to the explicit check below.
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

/** QS World University Rankings 2026 positions. */
const IITS = [
  { short: "IIT Delhi",       name: "Indian Institute of Technology Delhi",       city: "New Delhi",   rank: 123, website: "https://home.iitd.ac.in", established: 1961, students: 11000, faculty: 750 },
  { short: "IIT Bombay",      name: "Indian Institute of Technology Bombay",      city: "Mumbai",      rank: 129, website: "https://www.iitb.ac.in",  established: 1958, students: 11000, faculty: 700 },
  { short: "IIT Madras",      name: "Indian Institute of Technology Madras",      city: "Chennai",     rank: 180, website: "https://www.iitm.ac.in",  established: 1959, students: 10000, faculty: 680 },
  { short: "IIT Kharagpur",   name: "Indian Institute of Technology Kharagpur",   city: "Kharagpur",   rank: 215, website: "https://www.iitkgp.ac.in", established: 1951, students: 14000, faculty: 750 },
  { short: "IIT Kanpur",      name: "Indian Institute of Technology Kanpur",      city: "Kanpur",      rank: 222, website: "https://www.iitk.ac.in",  established: 1959, students: 9000,  faculty: 600 },
  { short: "IIT Guwahati",    name: "Indian Institute of Technology Guwahati",    city: "Guwahati",    rank: 334, website: "https://www.iitg.ac.in",  established: 1994, students: 7000,  faculty: 430 },
  { short: "IIT Roorkee",     name: "Indian Institute of Technology Roorkee",     city: "Roorkee",     rank: 339, website: "https://www.iitr.ac.in",  established: 1847, students: 9000,  faculty: 500 },
  { short: "IIT Indore",      name: "Indian Institute of Technology Indore",      city: "Indore",      rank: 556, website: "https://www.iiti.ac.in",  established: 2009, students: 3500,  faculty: 200 },
  { short: "IIT BHU",         name: "Indian Institute of Technology (BHU) Varanasi", city: "Varanasi", rank: 681, website: "https://www.iitbhu.ac.in", established: 1919, students: 7500, faculty: 400 },
  { short: "IIT Hyderabad",   name: "Indian Institute of Technology Hyderabad",   city: "Hyderabad",   rank: 681, website: "https://www.iith.ac.in",  established: 2008, students: 4500,  faculty: 300 },
  { short: "IIT Dhanbad",     name: "Indian Institute of Technology (ISM) Dhanbad", city: "Dhanbad",   rank: 926, website: "https://www.iitism.ac.in", established: 1926, students: 6500, faculty: 350 },
  { short: "IIT Gandhinagar", name: "Indian Institute of Technology Gandhinagar", city: "Gandhinagar", rank: 1201, website: "https://www.iitgn.ac.in", established: 2008, students: 2500, faculty: 180 },
  { short: "IIT Patna",       name: "Indian Institute of Technology Patna",       city: "Patna",       rank: 1201, website: "https://www.iitp.ac.in",  established: 2008, students: 3000,  faculty: 180 },
  { short: "IIT Ropar",       name: "Indian Institute of Technology Ropar",       city: "Rupnagar",    rank: 1201, website: "https://www.iitrpr.ac.in", established: 2008, students: 2400, faculty: 160 },
  { short: "IIT Mandi",       name: "Indian Institute of Technology Mandi",       city: "Mandi",       rank: 1201, website: "https://www.iitmandi.ac.in", established: 2009, students: 2200, faculty: 150 },
  { short: "IIT Jodhpur",     name: "Indian Institute of Technology Jodhpur",     city: "Jodhpur",     rank: 1201, website: "https://www.iitj.ac.in",  established: 2008, students: 2500,  faculty: 170 },
  { short: "IIT Bhubaneswar", name: "Indian Institute of Technology Bhubaneswar", city: "Bhubaneswar", rank: 1401, website: "https://www.iitbbs.ac.in", established: 2008, students: 2200, faculty: 140 },
  { short: "IIT Tirupati",    name: "Indian Institute of Technology Tirupati",    city: "Tirupati",    rank: null, website: "https://www.iittp.ac.in", established: 2015, students: 1500,  faculty: 110 },
  { short: "IIT Palakkad",    name: "Indian Institute of Technology Palakkad",    city: "Palakkad",    rank: null, website: "https://www.iitpkd.ac.in", established: 2015, students: 1400, faculty: 100 },
  { short: "IIT Bhilai",      name: "Indian Institute of Technology Bhilai",      city: "Bhilai",      rank: null, website: "https://www.iitbhilai.ac.in", established: 2016, students: 1200, faculty: 90 },
  { short: "IIT Goa",         name: "Indian Institute of Technology Goa",         city: "Ponda",       rank: null, website: "https://www.iitgoa.ac.in", established: 2016, students: 1000,  faculty: 80 },
  { short: "IIT Jammu",       name: "Indian Institute of Technology Jammu",       city: "Jammu",       rank: null, website: "https://www.iitjammu.ac.in", established: 2016, students: 1300, faculty: 95 },
  { short: "IIT Dharwad",     name: "Indian Institute of Technology Dharwad",     city: "Dharwad",     rank: null, website: "https://www.iitdh.ac.in", established: 2016, students: 1100,  faculty: 85 },
];

const now = new Date().toISOString();

/**
 * Median `overall` of existing rows, by QS world-rank band. Measured from the
 * 303 rows in `aur_universities` that carry both a QS rank and a composite
 * score, so derived values land among comparable institutions rather than on an
 * arbitrary scale.
 */
const QS_TO_OVERALL = [
  [25, 93.7],
  [75, 86.9],
  [125, 82.5],
  [200, 82.5],
  [300, 82.5],
  [425, 63.0],
  [600, 72.7],
  [850, 79.0],
  [1250, 53.3],
];

/**
 * Linearly interpolates a composite score for a QS rank. Returns null for
 * unranked institutions, which then sort with the other unscored rows rather
 * than receiving a score with nothing behind it.
 */
function deriveOverall(qsRank) {
  if (!qsRank) return null;

  const [firstRank, firstScore] = QS_TO_OVERALL[0];
  if (qsRank <= firstRank) return firstScore;

  for (let i = 0; i < QS_TO_OVERALL.length - 1; i++) {
    const [loRank, loScore] = QS_TO_OVERALL[i];
    const [hiRank, hiScore] = QS_TO_OVERALL[i + 1];
    if (qsRank <= hiRank) {
      const t = (qsRank - loRank) / (hiRank - loRank);
      return Math.round((loScore + t * (hiScore - loScore)) * 10) / 10;
    }
  }

  return QS_TO_OVERALL[QS_TO_OVERALL.length - 1][1];
}

function buildRow(iit) {
  const slug = `${iit.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-india`;
  const overall = deriveOverall(iit.rank);
  return {
    slug,
    overall,
    data: {
      city: iit.city,
      name: iit.name,
      rank: iit.rank,
      size: "",
      slug,
      focus: "engineering",
      state: null,
      country: "India",
      history: iit.rank ? [iit.rank] : [],
      logoUrl: null,
      overall,
      tuition: null,
      website: iit.website,
      avg_fees: null,
      isPublic: true,
      location: "India",
      logo_url: null,
      programs: [],
      research: "",
      subjects: ["Engineering", "Sciences"],
      teaching: null,
      citations: null,
      is_public: true,
      languages: ["English"],
      rank_2025: null,
      subregion: "",
      created_at: now,
      updated_at: now,
      campusPhoto: null,
      description: `${iit.name} (${iit.short}) is an Institute of National Importance in ${iit.city}, India, established in ${iit.established}.`,
      hasMedicine: false,
      intlFaculty: null,
      rankingYear: 2026,
      website_url: iit.website,
      campus_photo: null,
      has_medicine: false,
      intlStudents: null,
      staffWithPhd: null,
      employability: null,
      total_faculty: iit.faculty,
      hasScholarship: true,
      research_level: null,
      total_students: iit.students,
      has_scholarship: true,
      inboundExchange: null,
      established_year: iit.established,
      outboundExchange: null,
      papersPerFaculty: null,
      academicReputation: null,
      employerReputation: null,
      facultyStudentRatio: null,
      intlResearchNetwork: null,
      placement_percentage: null,
    },
  };
}

let inserted = 0;
let updated = 0;

for (const iit of IITS) {
  const { slug, overall, data } = buildRow(iit);
  const existing = await sql`
    SELECT id FROM aur_universities WHERE data->>'slug' = ${slug} LIMIT 1
  `;

  if (dryRun) {
    console.log(
      `${existing.length ? "would update" : "would insert"}: ${iit.name} ` +
        `(QS ${iit.rank ?? "unranked"} -> overall ${overall ?? "null"})`,
    );
    if (existing.length) updated++; else inserted++;
    continue;
  }

  if (existing.length > 0) {
    const id = String(existing[0].id);
    await sql`
      UPDATE aur_universities
      SET name = ${iit.name},
          location = 'India',
          overall = ${overall},
          data = ${JSON.stringify({ ...data, id })}::jsonb,
          updated_at = now()
      WHERE id = ${id}
    `;
    updated++;
    console.log(`updated: ${iit.name}`);
  } else {
    const id = randomUUID();
    await sql`
      INSERT INTO aur_universities (id, name, location, overall, data)
      VALUES (
        ${id}, ${iit.name}, 'India', ${overall},
        ${JSON.stringify({ ...data, id })}::jsonb
      )
    `;
    inserted++;
    console.log(`inserted: ${iit.name}`);
  }
}

const total = Number(
  (await sql`SELECT count(*)::int AS total FROM aur_universities`)[0].total,
);

console.log(`\n${dryRun ? "[dry run] " : ""}inserted ${inserted}, updated ${updated}. Table now holds ${total} institutions.`);
