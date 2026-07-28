"use client";

import { firebaseAuth } from "./firebase";

export async function authenticatedFetch(
  input: string,
  init: RequestInit = {},
) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Please sign in to continue.");
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(input, { ...init, headers });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message || "The request could not be completed.");
  }
  return response;
}
