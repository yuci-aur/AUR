"use client";

import { authenticatedFetch } from "./authenticated-fetch";

export type FirestoreBlog = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  description: string;
  content: string;
  cover_image: string | null;
  author: string | null;
  read_time: string | null;
  tags: string | null;
  featured: boolean;
  publish_date: string | null;
  created_at: string;
  updated_at: string;
};

export type FirestoreEvent = {
  id: string;
  title: string;
  description: string | null;
  type: "event" | "award";
  eligibility_criteria: string | null;
  deadline: string | null;
  status: "open" | "closed" | "archived";
  created_at: string;
};

async function publicJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Live content is unavailable right now.");
  return response.json() as Promise<T>;
}

export async function listPublishedBlogs(): Promise<FirestoreBlog[]> {
  return publicJson<FirestoreBlog[]>("/api/data/blogs");
}

export async function getBlog(blogId: string): Promise<FirestoreBlog | null> {
  const response = await fetch(`/api/data/blogs/${encodeURIComponent(blogId)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("The blog could not be loaded.");
  return response.json() as Promise<FirestoreBlog>;
}

export async function listEvents(): Promise<FirestoreEvent[]> {
  return publicJson<FirestoreEvent[]>("/api/data/events");
}

export async function listUniversityDirectory() {
  return publicJson<Array<{ id: string; name: string }>>(
    "/api/data/misc?resource=university-directory",
  );
}

export async function listMethodologyVersions() {
  return publicJson<Array<Record<string, unknown> & { id: string }>>(
    "/api/data/misc?resource=methodology",
  );
}

export async function subscribeToNewsletter(email: string) {
  const response = await fetch("/api/data/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "newsletter", email }),
  });
  if (!response.ok) throw new Error("Newsletter subscription failed.");
}

export async function createApplication(payload: {
  eventId: string;
  universityId: string;
  documents: string[];
}) {
  const response = await authenticatedFetch("/api/data/submissions", {
    method: "POST",
    body: JSON.stringify({ type: "application", ...payload }),
  });
  return ((await response.json()) as { id: string }).id;
}

export async function createNomination(payload: Record<string, unknown>) {
  const response = await authenticatedFetch("/api/data/submissions", {
    method: "POST",
    body: JSON.stringify({ type: "nomination", payload }),
  });
  return ((await response.json()) as { id: string }).id;
}
