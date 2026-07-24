import { API_BASE_URL } from "./universities";

/**
 * Admin API helpers — real JWT auth against the FastAPI /admin router.
 *
 * The access token returned by POST /admin/login is stored in localStorage
 * under ADMIN_TOKEN_KEY and sent as a Bearer token on every admin request.
 */

export const ADMIN_TOKEN_KEY = "aur_admin_token";

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
  author: string | null;
  featured: boolean;
  created_at: string;
  publish_date: string | null;
};

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Fetch wrapper that attaches the admin Bearer token and throws
 * AdminApiError with the backend's `detail` message on failure.
 */
export async function adminFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const detail =
      (payload as { detail?: string })?.detail ??
      (typeof payload === "string" ? payload : res.statusText);
    throw new AdminApiError(detail || "Request failed", res.status);
  }

  return payload as T;
}

// --- Auth ---
export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new AdminApiError(payload?.detail || "Login failed", res.status);
  }

  setAdminToken(payload.access_token);
  return payload as { access_token: string; refresh_token: string };
}

export function verifyAdmin() {
  return adminFetch<AdminProfile>("/admin/verify");
}

// --- Dashboard ---
export function getAdminStats() {
  return adminFetch<AdminStats>("/admin/stats");
}

// --- Users ---
export function listUsers(params: { q?: string; role?: string } = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.role) search.set("role", params.role);
  const qs = search.toString();
  return adminFetch<{ total: number; data: AdminUser[] }>(
    `/admin/users${qs ? `?${qs}` : ""}`
  );
}

export function updateUserRole(userId: string, role: "user" | "admin") {
  return adminFetch<AdminUser>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

// --- Blogs ---
export function listAdminBlogs() {
  return adminFetch<AdminBlog[]>("/admin/blogs");
}

export function deleteBlog(blogId: string) {
  return adminFetch(`/admin/blogs/${blogId}`, { method: "DELETE" });
}

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

export async function createBlog(payload: BlogPayload) {
  // The public POST /blogs/ endpoint handles slug generation.
  return adminFetch("/blogs/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// --- Universities ---
export type UniversityRegisterPayload = {
  // Required
  name: string;
  registration_code: string;
  ranking_score: number;
  description: string;
  // Optional
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

export function registerUniversity(payload: UniversityRegisterPayload) {
  return adminFetch<{ status: string; university_id: string }>(
    "/admin/university/register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
