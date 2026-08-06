"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { AlertCircle, Building2, Camera, Check, ExternalLink, FileCheck2, Globe2, Loader2, Mail, MapPin, Pencil, ShieldCheck, UserRound, X } from "lucide-react";
import { firebaseAuth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { uploadToCloudinary } from "../lib/cloudinary-upload";
import { authenticatedFetch } from "../lib/authenticated-fetch";
import { useToast } from "./feedback/ToastContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import InstitutionRegistration from "./InstitutionRegistration";

type ProfileRole = "Student" | "Faculty" | "Institution";
type Profile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  country: string;
  profile_role: ProfileRole;
  profile_photo: string | null;
  account_type: "student" | "institution";
  institution_application_status: string;
};
type InstitutionApplication = {
  institutionName: string;
  institutionType: string;
  country: string;
  website: string;
  accreditationId: string;
  representativeName: string;
  representativeEmail: string;
  status: string;
  rejectionReason?: string | null;
  submittedAt: string;
};
type Draft = { name: string; country: string; profile_role: ProfileRole; profile_photo: string | null };

/**
 * Announces an institution verification outcome once per change.
 *
 * There is no email on status changes, so a representative would otherwise only
 * discover an approval or rejection by re-reading their profile. The last status
 * seen is kept per account so the toast fires on the change, not every visit.
 */
function announceStatusChange(
  uid: string,
  status: string,
  showToast: (message: string, variant?: "info" | "success" | "warning") => void,
) {
  if (status !== "approved" && status !== "rejected") return;
  const key = `aur:institution-status:${uid}`;
  try {
    if (window.localStorage.getItem(key) === status) return;
    window.localStorage.setItem(key, status);
  } catch {
    return; // Private browsing blocks storage; skip rather than repeat the toast.
  }
  showToast(
    status === "approved"
      ? "Your institution has been verified and is now listed publicly."
      : "Your institution application needs changes — see the reviewer feedback below.",
    status === "approved" ? "success" : "warning",
  );
}

const fullName = (profile: Profile) => [profile.first_name, profile.last_name === "-" ? "" : profile.last_name].filter(Boolean).join(" ");
const toDraft = (profile: Profile): Draft => ({ name: fullName(profile), country: profile.country, profile_role: profile.profile_role, profile_photo: profile.profile_photo });

export default function ProfileSection() {
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [institutionApplication, setInstitutionApplication] = useState<InstitutionApplication | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [profileReloadKey, setProfileReloadKey] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setError("Please sign in to view your profile.");
        setLoading(false);
        return;
      }
      try {
        const response = await authenticatedFetch("/api/account");
        const account = (await response.json()) as {
          profile: Record<string, unknown>;
          institutionApplication: InstitutionApplication | null;
        };
        const stored = account.profile ?? {};
        const isInstitution = stored.account_type === "institution";
        const data: Profile = {
          id: user.uid,
          email: user.email ?? String(stored.email ?? ""),
          first_name: String(stored.first_name ?? user.displayName?.split(" ")[0] ?? "AUR"),
          last_name: String(stored.last_name ?? user.displayName?.split(" ").slice(1).join(" ") ?? ""),
          country: String(stored.country ?? ""),
          profile_role:
            isInstitution
              ? "Institution"
              : stored.profile_role === "Faculty"
                ? "Faculty"
                : "Student",
          profile_photo: typeof stored.profile_photo === "string" ? stored.profile_photo : null,
          account_type: isInstitution ? "institution" : "student",
          institution_application_status: String(
            stored.institution_application_status ?? (isInstitution ? "draft" : ""),
          ),
        };
        setInstitutionApplication(
          isInstitution ? account.institutionApplication : null,
        );
        setProfile(data); setDraft(toDraft(data));
        if (isInstitution) {
          announceStatusChange(
            user.uid,
            account.institutionApplication?.status ??
              data.institution_application_status,
            showToast,
          );
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to load your profile.");
      } finally { setLoading(false); }
    });
    return unsubscribe;
  }, [profileReloadKey, showToast]);

  const activePhoto = editing ? draft?.profile_photo : profile?.profile_photo;

  useEffect(() => {
    setPhotoFailed(false);
  }, [activePhoto]);

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || !draft) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setErrors((value) => ({ ...value, photo: "Choose a JPEG, PNG, or WebP image." }));
    if (file.size > 2 * 1024 * 1024) return setErrors((value) => ({ ...value, photo: "Photo must be smaller than 2 MB." }));
    setPhotoUploading(true);
    try {
      const uploaded = await uploadToCloudinary(file, {
        folder: "aur/profiles",
        resourceType: "image",
      });
      setDraft((value) => value ? { ...value, profile_photo: uploaded.secure_url } : value);
      setErrors((value) => ({ ...value, photo: "" }));
    } catch (reason) {
      setErrors((value) => ({
        ...value,
        photo: reason instanceof Error ? reason.message : "Unable to upload this image.",
      }));
    } finally {
      setPhotoUploading(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const nextErrors: Record<string, string> = {};
    if (!draft.name.trim()) nextErrors.name = "Name is required.";
    if (!draft.country.trim()) nextErrors.country = "Country is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const user = firebaseAuth.currentUser;
    if (!user) return setError("Your session has expired. Please sign in again.");
    setSaving(true); setError(null);
    try {
      const [firstName, ...lastNameParts] = draft.name.trim().split(/\s+/);
      const updated: Profile = {
        id: user.uid,
        email: user.email ?? profile?.email ?? "",
        first_name: firstName,
        last_name: lastNameParts.join(" ") || "-",
        country: draft.country.trim(),
        profile_role: draft.profile_role,
        profile_photo: draft.profile_photo,
        account_type: profile?.account_type ?? "student",
        institution_application_status:
          profile?.institution_application_status ?? "",
      };
      await authenticatedFetch("/api/account", {
        method: "PUT",
        body: JSON.stringify({
          name: draft.name,
          country: draft.country,
          profile_role: draft.profile_role,
          profile_photo: draft.profile_photo,
        }),
      });
      setProfile(updated); setDraft(toDraft(updated)); setEditing(false);
      window.dispatchEvent(new Event("aur-profile-change"));
      showToast("Profile updated successfully.", "success");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save your changes."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center text-[var(--aur-text-muted)]"><Loader2 className="mr-3 h-5 w-5 animate-spin" />Loading your profile…</div>;
  if (!profile || !draft) return <div role="alert" className="aur-card mx-auto mt-12 max-w-xl p-6 text-sm text-red-700">{error ?? "Profile unavailable."}</div>;

  if (profile.account_type === "institution") {
    const openApplication = () => {
      setApplicationOpen(true);
      window.requestAnimationFrame(() => {
        document
          .getElementById("institution-application-editor")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };

    return (
      <InstitutionProfile
        profile={profile}
        application={institutionApplication}
        photoFailed={photoFailed}
        onPhotoError={() => setPhotoFailed(true)}
        onManageApplication={openApplication}
        applicationEditor={
          applicationOpen ? (
            <div
              id="institution-application-editor"
              className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_-36px_rgba(15,42,76,0.45)] scroll-mt-24"
            >
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                    Institution account
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-[#17365f]">
                    Institution application
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApplicationOpen(false)}
                  className="h-auto gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </div>
              <div className="p-5 sm:p-8">
                <InstitutionRegistration
                  embedded
                  onBackToSignIn={() => setApplicationOpen(false)}
                  onComplete={() => {
                    setApplicationOpen(false);
                    setProfileReloadKey((key) => key + 1);
                  }}
                />
              </div>
            </div>
          ) : null
        }
      />
    );
  }

  const initials = `${profile.first_name[0] ?? ""}${profile.last_name !== "-" ? profile.last_name[0] ?? "" : ""}`.toUpperCase() || "A";
  return <section className="mx-auto w-full max-w-6xl pb-12 pt-3" aria-labelledby="profile-title">
    <form onSubmit={save} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_-36px_rgba(15,42,76,0.45)]">
      <div className="relative h-40 overflow-hidden bg-[linear-gradient(120deg,#102a4c_0%,#1a365d_58%,#285782_100%)] px-6 pt-8 sm:h-44 sm:px-10">
        <div className="absolute -right-14 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute right-20 top-8 h-24 w-24 rounded-full border border-amber-300/20" />
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 via-amber-300 to-transparent" />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">Account center</p>
        <h1 id="profile-title" className="mt-2 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">My profile</h1>
        <p className="mt-2 max-w-xl text-sm text-blue-100/80">Keep your identity and academic preferences up to date.</p>
      </div>
      <div className="px-5 pb-7 sm:px-10 sm:pb-10">
        <div className="-mt-11 flex items-end justify-between gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-[#e9eef5] shadow-xl ring-2 ring-amber-400 sm:h-28 sm:w-28">
            {activePhoto && !photoFailed ? (
              <Image
                src={activePhoto}
                alt=""
                fill
                unoptimized
                referrerPolicy="no-referrer"
                sizes="112px"
                className="object-cover"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <span className="flex h-full items-center justify-center bg-gradient-to-br from-[#dce8f5] to-[#f7f9fc] text-3xl font-bold tracking-wide text-[#1a365d]" aria-label={`${fullName(profile)} initials`}>
                {initials}
              </span>
            )}
            {editing && <button type="button" disabled={photoUploading} onClick={() => fileRef.current?.click()} className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-[#102a4c]/92 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#102a4c] disabled:opacity-70">{photoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}{photoUploading ? "Uploading" : "Change"}</button>}
          </div>
          {!editing && <Button type="button" onClick={() => { setDraft(toDraft(profile)); setErrors({}); setError(null); setEditing(true); }} className="mb-1 h-auto gap-2 rounded-xl border-0 bg-[#1a365d] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-[#102a4c] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"><Pencil className="h-4 w-4" />Edit profile</Button>}
        </div>
        <div className="mt-4 border-b border-slate-200 pb-6">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{fullName(profile)}</h2>
          <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} className="sr-only" aria-label="Upload profile photo" />
        {errors.photo && <p className="mt-2 text-xs text-red-600">{errors.photo}</p>}
        {error && <div role="alert" className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field icon={UserRound} label="Name" error={errors.name}>{editing ? <input className="aur-input" value={draft.name} maxLength={100} required onChange={(e) => setDraft({ ...draft, name: e.target.value })} /> : <Value>{fullName(profile)}</Value>}</Field>
          <Field icon={Mail} label="Email"><Value>{profile.email}</Value>{editing && <p className="mt-1 text-[11px] text-[var(--aur-text-muted)]">Email cannot be changed.</p>}</Field>
          <Field icon={MapPin} label="Country" error={errors.country}>{editing ? <input className="aur-input" value={draft.country} maxLength={100} required placeholder="Enter your country" onChange={(e) => setDraft({ ...draft, country: e.target.value })} /> : <Value>{profile.country || "Not provided"}</Value>}</Field>
          <Field icon={UserRound} label="Role">{editing ? <select className="aur-input" value={draft.profile_role} required disabled={profile.profile_role === "Institution"} onChange={(e) => setDraft({ ...draft, profile_role: e.target.value as ProfileRole })}>{profile.profile_role === "Institution" ? <option>Institution</option> : <><option>Student</option><option>Faculty</option></>}</select> : <Badge className="h-auto border-0 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-500/25 dark:text-amber-300">{profile.profile_role}</Badge>}</Field>
        </div>
        {editing && <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--aur-border)] pt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={saving} onClick={() => { setDraft(toDraft(profile)); setErrors({}); setError(null); setEditing(false); }} className="h-auto gap-2 rounded-lg border-[var(--aur-border-strong)] dark:border-[var(--aur-border-strong)] bg-transparent dark:bg-transparent px-5 py-2.5 text-xs font-semibold text-[var(--aur-text)] transition-colors hover:bg-[var(--aur-hover)] dark:hover:bg-[var(--aur-hover)] hover:text-[var(--aur-text)] disabled:opacity-100"><X className="h-4 w-4" />Cancel</Button>
          <Button type="submit" disabled={saving || photoUploading} className="h-auto border-0 gap-2 rounded-lg bg-[#1a365d] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-[#102a4c] focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? "Saving…" : "Save changes"}</Button>
        </div>}
      </div>
    </form>
  </section>;
}

function InstitutionProfile({
  profile,
  application,
  photoFailed,
  onPhotoError,
  onManageApplication,
  applicationEditor,
}: {
  profile: Profile;
  application: InstitutionApplication | null;
  photoFailed: boolean;
  onPhotoError: () => void;
  onManageApplication: () => void;
  applicationEditor: React.ReactNode;
}) {
  const rawStatus =
    application?.status || profile.institution_application_status || "draft";
  const status =
    rawStatus === "approved" || rawStatus === "rejected" || rawStatus === "pending"
      ? rawStatus
      : "draft";
  const statusCopy = {
    draft: {
      label: "Details required",
      description:
        "Complete the institution application before AUR can begin verification.",
      className: "border-blue-200 bg-blue-50 text-blue-800",
    },
    pending: {
      label: "Verification pending",
      description:
        "AUR is reviewing the official institution and accreditation details.",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    },
    approved: {
      label: "Verified institution",
      description:
        "The institution identity has been verified and institutional access is active.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    rejected: {
      label: "Needs attention",
      description:
        "The submitted details need correction. Update the application and resubmit — it returns to AUR for review.",
      className: "border-red-200 bg-red-50 text-red-800",
    },
  }[status];
  const institutionName =
    application?.institutionName || "Complete your institution profile";
  const representativeName =
    application?.representativeName || fullName(profile);
  const representativeEmail =
    application?.representativeEmail || profile.email;
  const initials = institutionName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <section className="mx-auto w-full max-w-6xl pb-12 pt-3" aria-labelledby="institution-profile-title">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_-36px_rgba(15,42,76,0.45)]">
        <header className="relative overflow-hidden bg-[linear-gradient(120deg,#102a4c_0%,#1a365d_58%,#285782_100%)] px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute right-24 top-8 h-28 w-28 rounded-full border border-amber-300/20" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-center gap-5">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white text-[#1a365d] shadow-xl ring-2 ring-amber-400">
                {profile.profile_photo && !photoFailed ? (
                  <Image
                    src={profile.profile_photo}
                    alt=""
                    fill
                    unoptimized
                    referrerPolicy="no-referrer"
                    sizes="96px"
                    className="object-cover"
                    onError={onPhotoError}
                  />
                ) : (
                  <span className="font-serif text-2xl font-bold">{initials || "AUR"}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                  Institution account
                </p>
                <h1 id="institution-profile-title" className="mt-2 max-w-2xl font-serif text-3xl font-bold leading-tight sm:text-4xl">
                  {institutionName}
                </h1>
                <p className="mt-2 flex items-center gap-2 text-sm text-blue-100/80">
                  <MapPin className="h-4 w-4 text-amber-300" />
                  {application?.country || "Country not provided"}
                </p>
              </div>
            </div>
            <span className={`relative inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${statusCopy.className}`}>
              <ShieldCheck className="h-4 w-4" />
              {statusCopy.label}
            </span>
          </div>
        </header>

        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.45fr_0.75fr] lg:p-10">
          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Official record
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Institution details
                </h2>
              </div>
              <Button
                type="button"
                onClick={onManageApplication}
                className="h-auto rounded-xl bg-[#1a365d] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#102a4c]"
              >
                {status === "draft" ? "Complete application" : "View application"}
              </Button>
            </div>

            {application ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <InstitutionField icon={Building2} label="Institution name" value={application.institutionName} />
                <InstitutionField icon={Building2} label="Institution type" value={application.institutionType} />
                <InstitutionField icon={MapPin} label="Country" value={application.country} />
                <InstitutionField icon={FileCheck2} label="Accreditation / registry ID" value={application.accreditationId} />
                <InstitutionField
                  icon={Globe2}
                  label="Official website"
                  value={
                    application.website ? (
                      <a href={application.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#1a365d] hover:underline">
                        {application.website}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      "Not provided"
                    )
                  }
                />
                <InstitutionField icon={ShieldCheck} label="Verification" value={statusCopy.label} />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-blue-300 bg-blue-50/60 p-6">
                <h3 className="text-base font-bold text-[#17365f]">
                  Institution details have not been submitted
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Add the official institution name, country, website, institution type,
                  and accreditation registry ID to begin verification.
                </p>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Authorized representative
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InstitutionField icon={UserRound} label="Representative" value={representativeName} nested />
                <InstitutionField icon={Mail} label="Work email" value={representativeEmail} nested />
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-6">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${statusCopy.className}`}>
              <ShieldCheck className="h-5 w-5" />
            </span>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Verification status
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#17365f]">
              {statusCopy.label}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {statusCopy.description}
            </p>

            {/* A rejection is only actionable if the reviewer's reason is shown. */}
            {status === "rejected" && application?.rejectionReason && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-red-700">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Reviewer feedback
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-red-900">
                  {application.rejectionReason}
                </p>
                <button
                  type="button"
                  onClick={onManageApplication}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Update and resubmit
                </button>
              </div>
            )}

            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-xs font-semibold text-slate-700">
                Institutional tools and billing activate only after verification.
              </p>
            </div>
          </aside>
        </div>
      </div>
      {applicationEditor}
    </section>
  );
}

function InstitutionField({
  icon: Icon,
  label,
  value,
  nested = false,
}: {
  icon: typeof Building2;
  label: string;
  value: React.ReactNode;
  nested?: boolean;
}) {
  return (
    <div className={nested ? "" : "rounded-xl border border-slate-200 bg-white p-4"}>
      <div className="flex items-center gap-2 text-[#1a365d]">
        <Icon className="h-4 w-4 text-amber-600" />
        <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">
          {label}
        </span>
      </div>
      <div className="mt-2 break-words text-sm font-semibold text-slate-900">
        {value || "Not provided"}
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, error, children }: { icon: typeof UserRound; label: string; error?: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-[var(--aur-border)] bg-[var(--aur-surface-2)] p-4 transition-colors hover:border-amber-500/40"><div className="mb-2 flex items-center gap-2 text-[#1a365d] dark:text-amber-300"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10"><Icon className="h-4 w-4" /></span><span className="aur-caption">{label}</span></div>{children}{error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}</div>;
}
function Value({ children }: { children: React.ReactNode }) { return <p className="break-words text-sm font-semibold text-[var(--aur-text)]">{children}</p>; }
