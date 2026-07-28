"use client";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import {
  ensureFirebasePersistence,
  firebaseAuth,
} from "./firebase";
import { authenticatedFetch } from "./authenticated-fetch";

export const ADMIN_TOKEN_KEY = "firebase-managed-session";

export type AdminProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
};

export type AdminUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  oauth_provider: string | null;
  created_at: string;
};

export type AdminStats = {
  total_users: number;
  total_admins: number;
  total_universities: number;
  total_blogs: number;
  published_blogs: number;
  total_events: number;
  total_applications: number;
  newsletter_subscribers: number;
};

export type AdminBlog = {
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
  created_at: string;
  updated_at: string;
  publish_date: string | null;
};

export type AdminEventAward = {
  id: string;
  title: string;
  description: string | null;
  type: "event" | "award";
  eligibility_criteria: string | null;
  deadline: string | null;
  status: "open" | "closed" | "archived";
  created_at: string;
};

export type EventAwardPayload = {
  title: string;
  description?: string | null;
  type: "event" | "award";
  eligibility_criteria?: string | null;
  status?: "open" | "closed" | "archived";
};

export type BlogPayload = {
  title: string;
  category: string;
  description: string;
  content: string;
  cover_image?: string | null;
  author?: string | null;
  read_time?: string | null;
  tags?: string | null;
  featured?: boolean;
  publish_date?: string | null;
  status: string;
};

export type UniversityRegisterPayload = {
  name: string;
  registration_code: string;
  ranking_score: number;
  description: string;
  country?: string | null;
  subregion?: string | null;
  state?: string | null;
  city?: string | null;
  size?: string | null;
  focus?: string | null;
  research_level?: string | null;
  is_public?: boolean | null;
  established_year?: number | null;
  total_students?: number | null;
  total_faculty?: number | null;
  avg_fees?: number | null;
  placement_percentage?: number | null;
  website_url?: string | null;
  logo_url?: string | null;
  campus_photo?: string | null;
  has_medicine?: boolean | null;
  has_scholarship?: boolean | null;
};

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function authReady(): Promise<User | null> {
  if (firebaseAuth.currentUser) return Promise.resolve(firebaseAuth.currentUser);
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function requireAdminUser() {
  const user = await authReady();
  if (!user) throw new AdminApiError("Admin sign-in required.", 401);
  const token = await user.getIdTokenResult();
  if (token.claims.admin !== true) {
    throw new AdminApiError("This account does not have admin access.", 403);
  }
  return user;
}

async function adminGet<T>(action: string): Promise<T> {
  await requireAdminUser();
  const response = await authenticatedFetch(
    `/api/admin/data?action=${encodeURIComponent(action)}`,
  );
  return response.json() as Promise<T>;
}

async function adminPost<T>(
  action: string,
  options: { id?: string; payload?: Record<string, unknown> } = {},
): Promise<T> {
  await requireAdminUser();
  const response = await authenticatedFetch("/api/admin/data", {
    method: "POST",
    body: JSON.stringify({ action, ...options }),
  });
  return response.json() as Promise<T>;
}

export function getAdminToken(): string | null {
  return firebaseAuth.currentUser ? ADMIN_TOKEN_KEY : null;
}

export function setAdminToken(_token: string): void {
  // Firebase Authentication owns token persistence and refresh.
}

export function clearAdminToken(): void {
  void signOut(firebaseAuth);
}

export async function adminLogin(email: string, password: string) {
  await ensureFirebasePersistence();
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  );
  const token = await credential.user.getIdTokenResult(true);
  if (token.claims.admin !== true) {
    await signOut(firebaseAuth);
    throw new AdminApiError("Admin access only.", 403);
  }
  return {
    access_token: token.token,
    refresh_token: "",
  };
}

export async function verifyAdmin(): Promise<AdminProfile> {
  return adminGet<AdminProfile>("verify");
}

export async function getAdminStats(): Promise<AdminStats> {
  return adminGet<AdminStats>("stats");
}

export async function listUsers(
  params: { q?: string; role?: string } = {},
): Promise<{ total: number; data: AdminUser[] }> {
  const response = await adminGet<{ total: number; data: AdminUser[] }>("users");
  let users = response.data;
  if (params.q) {
    const search = params.q.toLowerCase();
    users = users.filter(
      (user) =>
        user.email.toLowerCase().includes(search) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(search),
    );
  }
  if (params.role) users = users.filter((user) => user.role === params.role);
  return { total: users.length, data: users };
}

export async function updateUserRole(
  _userId: string,
  _role: "user" | "admin",
): Promise<AdminUser> {
  throw new AdminApiError(
    "User-role management is disabled because regular user data was not migrated.",
    400,
  );
}

export async function listAdminBlogs(): Promise<AdminBlog[]> {
  return adminGet<AdminBlog[]>("blogs");
}

export async function deleteBlog(blogId: string) {
  await adminPost("delete-blog", { id: blogId });
}

export async function createBlog(payload: BlogPayload): Promise<AdminBlog> {
  return adminPost<AdminBlog>("create-blog", {
    payload: payload as Record<string, unknown>,
  });
}

export async function updateBlog(
  blogId: string,
  payload: BlogPayload,
): Promise<AdminBlog> {
  return adminPost<AdminBlog>("update-blog", {
    id: blogId,
    payload: payload as Record<string, unknown>,
  });
}

export async function listEventsAndAwards(): Promise<AdminEventAward[]> {
  return adminGet<AdminEventAward[]>("events");
}

export async function createEventOrAward(
  payload: EventAwardPayload,
): Promise<AdminEventAward> {
  return adminPost<AdminEventAward>("create-event", {
    payload: payload as Record<string, unknown>,
  });
}

export async function updateEventOrAward(
  itemId: string,
  payload: Partial<EventAwardPayload>,
): Promise<AdminEventAward> {
  return adminPost<AdminEventAward>("update-event", {
    id: itemId,
    payload: payload as Record<string, unknown>,
  });
}

export async function deleteEventOrAward(itemId: string) {
  await adminPost("delete-event", { id: itemId });
}

export async function registerUniversity(payload: UniversityRegisterPayload) {
  return adminPost<{ status: string; university_id: string }>(
    "create-university",
    {
      payload: payload as Record<string, unknown>,
    },
  );
}
