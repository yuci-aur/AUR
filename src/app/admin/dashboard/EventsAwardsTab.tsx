"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import {
  AdminEventAward,
  EventAwardPayload,
  createEventOrAward,
  deleteEventOrAward,
  listEventsAndAwards,
  updateEventOrAward,
} from "../../lib/admin-api";

type FormState = {
  title: string;
  type: "event" | "award";
  description: string;
  eligibility_criteria: string;
  status: "open" | "closed" | "archived";
};

const emptyForm: FormState = {
  title: "",
  type: "event",
  description: "",
  eligibility_criteria: "",
  status: "open",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1A365D] focus:ring-2 focus:ring-[#1A365D]/15";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function EventsAwardsTab() {
  const [items, setItems] = useState<AdminEventAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    listEventsAndAwards()
      .then(setItems)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load listings.")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEdit = (item: AdminEventAward) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      type: item.type,
      description: item.description ?? "",
      eligibility_criteria: item.eligibility_criteria ?? "",
      status: item.status,
    });
    setFormError("");
    setSuccess("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    if (!form.title.trim()) {
      setFormError("Enter a title before saving.");
      return;
    }

    const payload: EventAwardPayload = {
      title: form.title.trim(),
      type: form.type,
      description: form.description.trim() || null,
      eligibility_criteria: form.eligibility_criteria.trim() || null,
      ...(editingId ? { status: form.status } : {}),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateEventOrAward(editingId, payload);
        setItems((current) =>
          current.map((item) => (item.id === editingId ? updated : item))
        );
        setSuccess("Changes saved.");
      } else {
        const created = await createEventOrAward(payload);
        setItems((current) => [...current, created]);
        setSuccess(
          `${created.type === "award" ? "Award" : "Event"} published.`
        );
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: AdminEventAward) => {
    if (
      !window.confirm(
        `Delete “${item.title}”? Associated applications will also be removed.`
      )
    ) {
      return;
    }

    setDeletingId(item.id);
    setError("");
    setSuccess("");
    try {
      await deleteEventOrAward(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setSuccess(`${item.type === "award" ? "Award" : "Event"} deleted.`);
      if (editingId === item.id) closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
            AUR programmes
          </p>
          <h2 className="text-2xl font-black text-[#1A365D]">
            Events & Awards
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Publish and maintain the opportunities shown on the public website.
          </p>
        </div>
        <button
          onClick={showForm ? closeForm : openCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#1A365D] px-4 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-[#122540]"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Close form" : "Add event or award"}
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSave}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-[#1A365D] px-6 py-4 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
              {editingId ? "Update listing" : "New listing"}
            </p>
            <h3 className="mt-1 text-lg font-black">
              {editingId ? "Edit event or award" : "Publish an event or award"}
            </h3>
          </div>

          <div className="space-y-4 p-6">
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Title *">
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="AUR Student Achievement Award"
                />
              </Field>
              <Field label="Listing type">
                <select
                  className={inputClass}
                  value={form.type}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      type: event.target.value as "event" | "award",
                    })
                  }
                >
                  <option value="event">Event</option>
                  <option value="award">Award</option>
                </select>
              </Field>
            </div>

            <Field label="Description">
              <textarea
                rows={3}
                className={inputClass}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Explain what this opportunity recognises or offers."
              />
            </Field>

            <Field label="Eligibility">
              <textarea
                rows={2}
                className={inputClass}
                value={form.eligibility_criteria}
                onChange={(event) =>
                  setForm({
                    ...form,
                    eligibility_criteria: event.target.value,
                  })
                }
                placeholder="Who can participate or apply?"
              />
            </Field>

            {editingId && (
              <Field label="Status">
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as FormState["status"],
                    })
                  }
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#1A365D] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#122540] disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : editingId ? "Save changes" : "Publish"}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-12">
          <Loader2 className="h-7 w-7 animate-spin text-[#1A365D]" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="mb-4 font-semibold text-red-700">{error}</p>
          <button
            onClick={load}
            className="mx-auto flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 font-bold text-red-600 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <button
          onClick={openCreate}
          className="w-full rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 transition-colors hover:border-[#1A365D] hover:text-[#1A365D]"
        >
          <Plus className="mx-auto mb-3 h-6 w-6" />
          <span className="font-bold">Add the first event or award</span>
        </button>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 md:grid-cols-[minmax(0,1fr)_120px_110px_100px]">
            <span>Listing</span>
            <span className="hidden md:block">Type</span>
            <span className="hidden md:block">Status</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const Icon = item.type === "award" ? Award : CalendarDays;
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_120px_110px_100px]"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        item.type === "award"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#1A365D]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
                        {item.description || "No description provided."}
                      </p>
                      <div className="mt-2 flex gap-2 md:hidden">
                        <span className="text-xs font-bold capitalize text-slate-500">
                          {item.type}
                        </span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs font-bold capitalize text-slate-500">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="hidden text-sm font-semibold capitalize text-slate-600 md:block">
                    {item.type}
                  </span>
                  <span
                    className={`hidden w-fit rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider md:block ${
                      item.status === "open"
                        ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                        : item.status === "closed"
                          ? "border-slate-200 bg-slate-100 text-slate-600"
                          : "border-amber-200 bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.status}
                  </span>
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      aria-label={`Edit ${item.title}`}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      aria-label={`Delete ${item.title}`}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
