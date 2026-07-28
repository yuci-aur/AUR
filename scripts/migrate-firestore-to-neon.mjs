import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { neon } from "@neondatabase/serverless";
import { initializeApp } from "firebase/app";
import {
  collection,
  getDocs,
  getFirestore,
  terminate,
} from "firebase/firestore";

const workspace = process.cwd();

function loadLocalEnvironment() {
  const environmentPath = path.join(workspace, ".env.local");
  const contents = fs.readFileSync(environmentPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function asIso(value, fallback = new Date().toISOString()) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function nullableIso(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

async function readCollection(db, name) {
  try {
    const snapshot = await getDocs(collection(db, name));
    return snapshot.docs.map((document) => ({
      id: document.id,
      data: document.data(),
    }));
  } catch (error) {
    console.warn(`Skipped ${name}: ${error instanceof Error ? error.message : "access denied"}`);
    return [];
  }
}

loadLocalEnvironment();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from .env.local");
}

const sql = neon(process.env.DATABASE_URL);
const schema = fs.readFileSync(path.join(workspace, "database", "schema.sql"), "utf8");

for (const statement of schema
  .split(";")
  .map((value) => value.trim())
  .filter(Boolean)) {
  await sql.query(statement);
}

const firebaseApp = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const firestore = getFirestore(firebaseApp);

const collections = [
  "universities",
  "blogs",
  "events",
  "methodologyVersions",
  "notifications",
  "newsletterSubscribers",
  "applications",
  "nominations",
  "adminProfiles",
  "userProfiles",
  "institutionApplications",
];

const migrated = {};

for (const collectionName of collections) {
  const rows = await readCollection(firestore, collectionName);
  migrated[collectionName] = rows.length;
  const operations = [];

  for (const { id, data } of rows) {
    if (collectionName === "universities") {
      operations.push(sql`
        INSERT INTO aur_universities (id, name, location, overall, data, created_at, updated_at)
        VALUES (
          ${id},
          ${asString(data.name, "Unknown University")},
          ${asString(data.location ?? data.country)},
          ${asNumber(data.overall)},
          ${JSON.stringify(data)}::jsonb,
          ${asIso(data.created_at)},
          ${asIso(data.updated_at)}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          location = EXCLUDED.location,
          overall = EXCLUDED.overall,
          data = EXCLUDED.data,
          updated_at = EXCLUDED.updated_at
      `);
      continue;
    }

    if (collectionName === "blogs") {
      operations.push(sql`
        INSERT INTO aur_blogs (
          id, title, slug, category, status, description, content, cover_image,
          author, read_time, tags, featured, publish_date, created_at, updated_at
        )
        VALUES (
          ${id}, ${asString(data.title)}, ${asString(data.slug, id)},
          ${asString(data.category)}, ${asString(data.status, "draft").toLowerCase()},
          ${asString(data.description)}, ${asString(data.content)},
          ${data.cover_image ?? null}, ${data.author ?? null}, ${data.read_time ?? null},
          ${data.tags ?? null}, ${Boolean(data.featured)}, ${nullableIso(data.publish_date)},
          ${asIso(data.created_at)}, ${asIso(data.updated_at)}
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          category = EXCLUDED.category,
          status = EXCLUDED.status,
          description = EXCLUDED.description,
          content = EXCLUDED.content,
          cover_image = EXCLUDED.cover_image,
          author = EXCLUDED.author,
          read_time = EXCLUDED.read_time,
          tags = EXCLUDED.tags,
          featured = EXCLUDED.featured,
          publish_date = EXCLUDED.publish_date,
          updated_at = EXCLUDED.updated_at
      `);
      continue;
    }

    if (collectionName === "events") {
      operations.push(sql`
        INSERT INTO aur_events (
          id, title, description, type, eligibility_criteria, deadline,
          status, created_at, updated_at
        )
        VALUES (
          ${id}, ${asString(data.title)}, ${data.description ?? null},
          ${data.type === "award" ? "award" : "event"},
          ${data.eligibility_criteria ?? null}, ${nullableIso(data.deadline)},
          ${["open", "closed", "archived"].includes(data.status) ? data.status : "open"},
          ${asIso(data.created_at)}, ${asIso(data.updated_at)}
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          type = EXCLUDED.type,
          eligibility_criteria = EXCLUDED.eligibility_criteria,
          deadline = EXCLUDED.deadline,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      `);
      continue;
    }

    if (collectionName === "newsletterSubscribers") {
      operations.push(sql`
        INSERT INTO aur_newsletter_subscribers (email, active, subscribed_at)
        VALUES (
          ${asString(data.email, id).toLowerCase()},
          ${data.active !== false},
          ${asIso(data.subscribed_at)}
        )
        ON CONFLICT (email) DO UPDATE SET
          active = EXCLUDED.active,
          subscribed_at = EXCLUDED.subscribed_at
      `);
      continue;
    }

    operations.push(sql`
      INSERT INTO aur_content_documents (collection_name, id, data, created_at, updated_at)
      VALUES (
        ${collectionName},
        ${id},
        ${JSON.stringify(data)}::jsonb,
        ${asIso(data.created_at ?? data.submitted_at)},
        ${asIso(data.updated_at)}
      )
      ON CONFLICT (collection_name, id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at
    `);
  }

  for (let index = 0; index < operations.length; index += 100) {
    await sql.transaction(operations.slice(index, index + 100));
  }
}

if (migrated.blogs === 0) {
  await sql`
    INSERT INTO aur_blogs (
      id, title, slug, category, status, description, content, cover_image,
      author, read_time, tags, featured, publish_date, created_at, updated_at
    )
    SELECT
      id::text, title, slug, category, lower(status), description, content,
      cover_image, author, read_time, tags, featured, publish_date,
      created_at, updated_at
    FROM blogs
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      slug = EXCLUDED.slug,
      category = EXCLUDED.category,
      status = EXCLUDED.status,
      description = EXCLUDED.description,
      content = EXCLUDED.content,
      cover_image = EXCLUDED.cover_image,
      author = EXCLUDED.author,
      read_time = EXCLUDED.read_time,
      tags = EXCLUDED.tags,
      featured = EXCLUDED.featured,
      publish_date = EXCLUDED.publish_date,
      updated_at = EXCLUDED.updated_at
  `;
}

await terminate(firestore);

const counts = {
  universities: Number((await sql`SELECT count(*)::int AS count FROM aur_universities`)[0].count),
  blogs: Number((await sql`SELECT count(*)::int AS count FROM aur_blogs`)[0].count),
  events: Number((await sql`SELECT count(*)::int AS count FROM aur_events`)[0].count),
  otherDocuments: Number((await sql`SELECT count(*)::int AS count FROM aur_content_documents`)[0].count),
};

console.log(JSON.stringify({ firestore: migrated, neon: counts }, null, 2));
