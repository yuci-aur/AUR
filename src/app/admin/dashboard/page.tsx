"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Building2,
  LogOut,
  Users,
  GraduationCap,
  FileCheck,
  ShieldCheck,
  Mail,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  AdminBlog,
  AdminProfile,
  AdminStats,
  AdminUser,
  clearAdminToken,
  createBlog,
  deleteBlog,
  getAdminStats,
  getAdminToken,
  listAdminBlogs,
  listUsers,
  registerUniversity,
  updateUserRole,
  verifyAdmin,
} from "../../lib/admin-api";

type Tab = "overview" | "blogs" | "universities" | "users";

// ------------------------------------------------------------------ Sidebar
const Sidebar = ({
  activeTab,
  setActiveTab,
  onLogout,
  admin,
}: {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  onLogout: () => void;
  admin: AdminProfile | null;
}) => {
  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "blogs", label: "Manage Blogs", icon: BookOpen },
    { id: "universities", label: "Universities", icon: Building2 },
    { id: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="w-64 bg-[#1A365D] min-h-screen text-white flex flex-col fixed left-0 top-0 bottom-0 shadow-2xl z-20">
      <div className="p-6 border-b border-white/10 flex items-center space-x-3 bg-white/5">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold leading-tight tracking-wide">Admin Portal</h2>
          <p className="text-blue-200 text-xs font-medium">AUR Platform</p>
        </div>
      </div>

      <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-bold text-blue-300/70 uppercase tracking-wider mb-4 ml-2">
          Menu
        </div>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white text-[#1A365D] shadow-lg font-bold"
                : "text-blue-100/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 bg-black/10 space-y-3">
        {admin && (
          <div className="px-2">
            <p className="text-sm font-bold text-white leading-tight truncate">
              {admin.first_name} {admin.last_name}
            </p>
            <p className="text-xs text-blue-200/70 truncate">{admin.email}</p>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-300 hover:bg-red-500/20 hover:text-red-100 rounded-xl transition-all font-bold"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------- Stat card
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: typeof Users;
  color: string;
}) => (
  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md flex items-center justify-between transition-all">
    <div>
      <p className="text-sm font-bold text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-black text-[#1A365D] tracking-tight">{value}</h3>
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon className="w-7 h-7" />
    </div>
  </div>
);

// -------------------------------------------------------------- Overview tab
const OverviewTab = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    getAdminStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  if (loading) return <PanelLoader />;
  if (error) return <PanelError message={error} onRetry={load} />;
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.total_users} icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard title="Admins" value={stats.total_admins} icon={ShieldCheck} color="bg-indigo-50 text-indigo-600" />
        <StatCard title="Universities" value={stats.total_universities} icon={Building2} color="bg-purple-50 text-purple-600" />
        <StatCard title="Blogs" value={stats.total_blogs} icon={BookOpen} color="bg-amber-50 text-amber-600" />
        <StatCard title="Published Blogs" value={stats.published_blogs} icon={FileCheck} color="bg-emerald-50 text-emerald-600" />
        <StatCard title="Events" value={stats.total_events} icon={GraduationCap} color="bg-rose-50 text-rose-600" />
        <StatCard title="Applications" value={stats.total_applications} icon={FileCheck} color="bg-cyan-50 text-cyan-600" />
        <StatCard title="Newsletter Subs" value={stats.newsletter_subscribers} icon={Mail} color="bg-teal-50 text-teal-600" />
      </div>
    </div>
  );
};

// -------------------------------------------------------------- Blogs tab
const emptyBlog = {
  title: "",
  category: "Featured Insight",
  description: "",
  content: "",
  author: "",
  read_time: "",
  tags: "",
  cover_image: "",
  featured: false,
  status: "Published",
};

const BlogsTab = () => {
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyBlog });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    listAdminBlogs()
      .then(setBlogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.title || !form.description || !form.content) {
      setFormError("Title, description and content are required.");
      return;
    }
    setSubmitting(true);
    try {
      await createBlog({ ...form });
      setForm({ ...emptyBlog });
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create blog.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post? This cannot be undone.")) return;
    setBlogs((prev) => prev.filter((b) => b.id !== id));
    try {
      await deleteBlog(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[#1A365D]">Blog Posts</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 bg-[#1A365D] hover:bg-[#122540] text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Close" : "New Blog"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
        >
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title *">
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Category">
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>Featured Insight</option>
                <option>Latest Report</option>
                <option>Regional Briefing</option>
              </select>
            </Field>
            <Field label="Author">
              <input className={inputCls} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </Field>
            <Field label="Read Time">
              <input className={inputCls} placeholder="6 min read" value={form.read_time} onChange={(e) => setForm({ ...form, read_time: e.target.value })} />
            </Field>
            <Field label="Cover Image URL">
              <input className={inputCls} value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} />
            </Field>
            <Field label="Tags (comma separated)">
              <input className={inputCls} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </Field>
          </div>
          <Field label="Short Description *">
            <textarea rows={2} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Content *">
            <textarea rows={6} className={inputCls} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </Field>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 accent-[#1A365D]" />
              Featured
            </label>
            <div className="flex items-center gap-3">
              <select className={inputCls + " w-auto"} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-[#1A365D] hover:bg-[#122540] text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Saving..." : "Save Blog"}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <PanelLoader />
      ) : error ? (
        <PanelError message={error} onRetry={load} />
      ) : blogs.length === 0 ? (
        <EmptyState message="No blog posts yet. Create your first one." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Title</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Category</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {blogs.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#1A365D] flex items-center gap-2">
                    {b.featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                    {b.title}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{b.category}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        b.status === "Published"
                          ? "text-emerald-700 bg-emerald-100 border-emerald-200"
                          : "text-amber-700 bg-amber-100 border-amber-200"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------- Universities tab
const emptyUniversity = {
  // Required
  name: "",
  registration_code: "",
  ranking_score: "",
  description: "",
  // Location
  country: "",
  subregion: "",
  state: "",
  city: "",
  // Classification
  size: "",
  focus: "",
  research_level: "",
  is_public: "true",
  // Facts
  established_year: "",
  total_students: "",
  total_faculty: "",
  avg_fees: "",
  placement_percentage: "",
  // Enrichment
  website_url: "",
  logo_url: "",
  campus_photo: "",
  has_medicine: false,
  has_scholarship: false,
};

const UniversitiesTab = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyUniversity });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const set = <K extends keyof typeof emptyUniversity>(
    key: K,
    value: (typeof emptyUniversity)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!form.name || !form.registration_code || !form.ranking_score || !form.description) {
      setFormError("Name, registration code, ranking score and description are required.");
      return;
    }
    const score = Number(form.ranking_score);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setFormError("Ranking score must be a number between 0 and 100.");
      return;
    }

    // Only include optional fields that were actually filled in.
    const text = (v: string) => (v.trim() ? v.trim() : undefined);
    const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

    setSubmitting(true);
    try {
      await registerUniversity({
        name: form.name.trim(),
        registration_code: form.registration_code.trim(),
        ranking_score: score,
        description: form.description.trim(),
        country: text(form.country),
        subregion: text(form.subregion),
        state: text(form.state),
        city: text(form.city),
        size: text(form.size),
        focus: text(form.focus),
        research_level: text(form.research_level),
        is_public: form.is_public === "true",
        established_year: num(form.established_year),
        total_students: num(form.total_students),
        total_faculty: num(form.total_faculty),
        avg_fees: num(form.avg_fees),
        placement_percentage: num(form.placement_percentage),
        website_url: text(form.website_url),
        logo_url: text(form.logo_url),
        campus_photo: text(form.campus_photo),
        has_medicine: form.has_medicine,
        has_scholarship: form.has_scholarship,
      });
      setSuccessMsg(`"${form.name.trim()}" was registered successfully.`);
      setForm({ ...emptyUniversity });
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to register university."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[#1A365D]">Universities</h2>
        <button
          onClick={() => {
            setShowForm((s) => !s);
            setSuccessMsg("");
          }}
          className="flex items-center gap-2 bg-[#1A365D] hover:bg-[#122540] text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Close" : "Register University"}
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 font-semibold text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {showForm ? (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-8"
        >
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
              {formError}
            </div>
          )}

          {/* Basic (required) */}
          <FormSection title="Basic Information" subtitle="Required">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="University Name *">
                <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. National University of Singapore" />
              </Field>
              <Field label="Registration Code *">
                <input className={inputCls} value={form.registration_code} onChange={(e) => set("registration_code", e.target.value)} placeholder="e.g. REG-2026-XYZ" />
              </Field>
              <Field label="Ranking Score * (0–100)">
                <input type="number" step="0.1" min="0" max="100" className={inputCls} value={form.ranking_score} onChange={(e) => set("ranking_score", e.target.value)} placeholder="e.g. 85.5" />
              </Field>
            </div>
            <Field label="Description *">
              <textarea rows={4} className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detailed description of the university..." />
            </Field>
          </FormSection>

          {/* Location */}
          <FormSection title="Location" subtitle="Optional">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="Country">
                <input className={inputCls} value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="e.g. Singapore" />
              </Field>
              <Field label="Subregion">
                <input className={inputCls} value={form.subregion} onChange={(e) => set("subregion", e.target.value)} placeholder="e.g. Southeast Asia" />
              </Field>
              <Field label="State / Province">
                <input className={inputCls} value={form.state} onChange={(e) => set("state", e.target.value)} />
              </Field>
              <Field label="City">
                <input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
            </div>
          </FormSection>

          {/* Classification */}
          <FormSection title="Classification" subtitle="Optional">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="Size">
                <select className={inputCls} value={form.size} onChange={(e) => set("size", e.target.value)}>
                  <option value="">—</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                  <option value="Extra Large">Extra Large</option>
                </select>
              </Field>
              <Field label="Focus">
                <select className={inputCls} value={form.focus} onChange={(e) => set("focus", e.target.value)}>
                  <option value="">—</option>
                  <option value="Comprehensive">Comprehensive</option>
                  <option value="Focused">Focused</option>
                  <option value="Specialist">Specialist</option>
                </select>
              </Field>
              <Field label="Research Level">
                <select className={inputCls} value={form.research_level} onChange={(e) => set("research_level", e.target.value)}>
                  <option value="">—</option>
                  <option value="Very High">Very High</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </Field>
              <Field label="Type">
                <select className={inputCls} value={form.is_public} onChange={(e) => set("is_public", e.target.value)}>
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </select>
              </Field>
            </div>
          </FormSection>

          {/* Institutional facts */}
          <FormSection title="Institutional Facts" subtitle="Optional">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Established Year">
                <input type="number" className={inputCls} value={form.established_year} onChange={(e) => set("established_year", e.target.value)} placeholder="e.g. 1905" />
              </Field>
              <Field label="Total Students">
                <input type="number" min="0" className={inputCls} value={form.total_students} onChange={(e) => set("total_students", e.target.value)} placeholder="e.g. 30000" />
              </Field>
              <Field label="Total Faculty">
                <input type="number" min="0" className={inputCls} value={form.total_faculty} onChange={(e) => set("total_faculty", e.target.value)} placeholder="e.g. 2500" />
              </Field>
              <Field label="Average Fees (per year)">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.avg_fees} onChange={(e) => set("avg_fees", e.target.value)} placeholder="e.g. 15000" />
              </Field>
              <Field label="Placement % (0–100)">
                <input type="number" min="0" max="100" step="0.1" className={inputCls} value={form.placement_percentage} onChange={(e) => set("placement_percentage", e.target.value)} placeholder="e.g. 92.5" />
              </Field>
            </div>
          </FormSection>

          {/* Enrichment */}
          <FormSection title="Media & Extras" subtitle="Optional">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Website URL">
                <input className={inputCls} value={form.website_url} onChange={(e) => set("website_url", e.target.value)} placeholder="https://..." />
              </Field>
              <Field label="Logo URL">
                <input className={inputCls} value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
              </Field>
              <Field label="Campus Photo URL">
                <input className={inputCls} value={form.campus_photo} onChange={(e) => set("campus_photo", e.target.value)} placeholder="https://..." />
              </Field>
            </div>
            <div className="flex flex-wrap gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.has_medicine} onChange={(e) => set("has_medicine", e.target.checked)} className="w-4 h-4 accent-[#1A365D]" />
                Offers Medicine
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.has_scholarship} onChange={(e) => set("has_scholarship", e.target.checked)} className="w-4 h-4 accent-[#1A365D]" />
                Offers Scholarships
              </label>
            </div>
          </FormSection>

          <div className="flex justify-end border-t border-slate-200 pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-[#1A365D] hover:bg-[#122540] text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Registering..." : "Register University"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1A365D] mb-1">Add a new university</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
                Register a new institution — name, registration code, ranking score and description
                are required; location, classification, facts and media are optional. Click{" "}
                <span className="font-semibold text-[#1A365D]">Register University</span> to open the form.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------- Users tab
const UsersTab = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    listUsers({ q: query || undefined, role: roleFilter || undefined })
      .then((res) => {
        setUsers(res.data);
        setTotal(res.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [query, roleFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggleRole = async (u: AdminUser) => {
    const next = u.role === "admin" ? "user" : "admin";
    if (!confirm(`Change ${u.email} to "${next}"?`)) return;
    try {
      const updated = await updateUserRole(u.id, next);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-[#1A365D]">
          Users <span className="text-slate-400 text-lg font-bold">({total})</span>
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email..."
              className="bg-white border border-slate-200 text-sm rounded-xl pl-9 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-[#1A365D]/30"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A365D]/30"
          >
            <option value="">All roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {loading ? (
        <PanelLoader />
      ) : error ? (
        <PanelError message={error} onRetry={load} />
      ) : users.length === 0 ? (
        <EmptyState message="No users match your search." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">User</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Role</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Provider</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Joined</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#1A365D]">
                      {u.first_name} {u.last_name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        u.role === "admin"
                          ? "text-indigo-700 bg-indigo-100 border-indigo-200"
                          : "text-slate-600 bg-slate-100 border-slate-200"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 capitalize">{u.oauth_provider || "email"}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleRole(u)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      {u.role === "admin" ? "Make User" : "Make Admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------- Small helpers
const inputCls =
  "w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1A365D]/50 focus:border-[#1A365D] shadow-sm";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-bold text-slate-700">{label}</label>
    {children}
  </div>
);

const FormSection = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <div className="flex items-baseline gap-2 border-b border-slate-100 pb-2">
      <h3 className="text-sm font-black uppercase tracking-wider text-[#1A365D]">{title}</h3>
      {subtitle && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {subtitle}
        </span>
      )}
    </div>
    {children}
  </div>
);

const PanelLoader = () => (
  <div className="flex items-center justify-center py-20 text-[#1A365D]">
    <Loader2 className="w-8 h-8 animate-spin" />
  </div>
);

const PanelError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col items-center text-center">
    <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
    <p className="text-red-700 font-semibold mb-4">{message}</p>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 bg-white border border-red-200 text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors"
    >
      <RefreshCw className="w-4 h-4" /> Retry
    </button>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500 font-medium">
    {message}
  </div>
);

// ------------------------------------------------------------------- Page
export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace("/admin/login");
      return;
    }
    verifyAdmin()
      .then((profile) => {
        setAdmin(profile);
        setChecking(false);
      })
      .catch(() => {
        clearAdminToken();
        router.replace("/admin/login");
      });
  }, [router]);

  const handleLogout = () => {
    clearAdminToken();
    router.push("/admin/login");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-[#1A365D]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} admin={admin} />

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-xl font-black text-[#1A365D] tracking-tight capitalize">
              {activeTab === "overview" ? "Dashboard Overview" : activeTab}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Advanced University Ranking — Admin
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#1A365D] rounded-full flex items-center justify-center text-white font-black">
              {admin ? admin.first_name.charAt(0).toUpperCase() : "A"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "blogs" && <BlogsTab />}
          {activeTab === "universities" && <UniversitiesTab />}
          {activeTab === "users" && <UsersTab />}
        </main>
      </div>
    </div>
  );
}
