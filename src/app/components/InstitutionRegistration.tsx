"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Globe2,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage } from "../lib/auth-error-message";
import { authenticatedFetch } from "../lib/authenticated-fetch";
import { firebaseAuth } from "../lib/firebase";

type FormState = {
  institutionName: string;
  institutionType: string;
  country: string;
  website: string;
  accreditationId: string;
  representativeName: string;
  representativeEmail: string;
  password: string;
};

const initialForm: FormState = {
  institutionName: "",
  institutionType: "University",
  country: "",
  website: "",
  accreditationId: "",
  representativeName: "",
  representativeEmail: "",
  password: "",
};

export default function InstitutionRegistration({
  onBackToSignIn,
  onComplete,
  embedded = false,
  authMode = "signup",
}: {
  onBackToSignIn: () => void;
  onComplete?: () => void;
  embedded?: boolean;
  authMode?: "signup" | "login";
}) {
  const [form, setForm] = useState(initialForm);
  const [currentUser, setCurrentUser] = useState<User | null>(firebaseAuth.currentUser);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<"draft" | "pending" | "approved" | "rejected">("draft");
  const [checkingApplication, setCheckingApplication] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth, async (user) => {
        setCurrentUser(user);
        if (user) {
          setForm((value) => ({
            ...value,
            representativeName: value.representativeName || user.displayName || "",
            representativeEmail: value.representativeEmail || user.email || "",
          }));
          setCheckingApplication(true);
          try {
            const response = await authenticatedFetch("/api/account");
            const account = (await response.json()) as {
              institutionApplication?: { status?: string } | null;
            };
            if (account.institutionApplication) {
              const storedStatus = String(
                account.institutionApplication.status ?? "pending",
              );
              setApplicationStatus(
                storedStatus === "approved" || storedStatus === "rejected"
                  ? storedStatus
                  : "pending",
              );
              setSubmitted(true);
            }
          } finally {
            setCheckingApplication(false);
          }
        }
      }),
    [],
  );

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function handleGoogleAuthentication() {
    setError("");
    setGoogleLoading(true);
    try {
      await setPersistence(firebaseAuth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(firebaseAuth, provider);
      await authenticatedFetch("/api/account");
      setCurrentUser(credential.user);
      setForm((value) => ({
        ...value,
        representativeName:
          value.representativeName || credential.user.displayName || "",
        representativeEmail: credential.user.email || value.representativeEmail,
        password: "",
      }));
    } catch (reason) {
      setError(authErrorMessage(reason, "google"));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleInstitutionLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await setPersistence(firebaseAuth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        loginEmail.trim(),
        loginPassword,
      );
      const response = await authenticatedFetch("/api/account");
      const account = (await response.json()) as {
        profile?: { account_type?: string };
        institutionApplication?: unknown;
      };
      if (
        account.profile?.account_type !== "institution" &&
        !account.institutionApplication
      ) {
        await signOut(firebaseAuth);
        setError("This account is registered as a student. Choose Student to sign in.");
        return;
      }
      setCurrentUser(credential.user);
    } catch (reason) {
      setError(authErrorMessage(reason, "email-login"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const website = form.website.trim();
    if (website && !/^https?:\/\/.+/i.test(website)) {
      setError("Enter the full website address, including https://.");
      return;
    }

    if (!currentUser && form.password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }

    setSubmitting(true);
    let newlyCreatedUser: User | null = null;
    try {
      let user = currentUser;
      if (!user) {
        const credential = await createUserWithEmailAndPassword(
          firebaseAuth,
          form.representativeEmail.trim(),
          form.password,
        );
        user = credential.user;
        newlyCreatedUser = credential.user;
        await updateProfile(user, { displayName: form.representativeName.trim() });
      }

      await authenticatedFetch("/api/account", {
        method: "POST",
        body: JSON.stringify({
          institutionName: form.institutionName.trim(),
          institutionType: form.institutionType,
          country: form.country.trim(),
          website,
          accreditationId: form.accreditationId.trim(),
          representativeName: form.representativeName.trim(),
        }),
      });

      localStorage.setItem("aur_logged_in", "true");
      window.dispatchEvent(new Event("aur-auth-change"));
      setCurrentUser(user);
      setApplicationStatus("pending");
      setSubmitted(true);
    } catch (reason) {
      if (newlyCreatedUser) {
        await deleteUser(newlyCreatedUser).catch(() => undefined);
      }
      setError(
        reason instanceof Error && reason.name.startsWith("Firebase")
          ? authErrorMessage(reason, "signup")
          : "We couldn’t submit the institution application. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingApplication) {
    return (
      <div className="flex min-h-56 items-center justify-center text-sm font-medium text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking institution verification…
      </div>
    );
  }

  if (submitted) {
    const approved = applicationStatus === "approved";
    const rejected = applicationStatus === "rejected";
    const statusTitle = approved
      ? "Institution verified"
      : rejected
        ? "Application needs attention"
        : "Verification is pending";
    const statusDescription = approved
      ? "Your institution has been verified. Institutional access is now available."
      : rejected
        ? "The application could not be verified with the submitted information. Contact AUR support before resubmitting."
        : "AUR is reviewing the institution and accreditation details. You can continue using the account while verification is in progress.";

    if (embedded) {
      return (
        <div className={`rounded-2xl border p-6 text-center ${approved ? "border-emerald-200 bg-emerald-50" : rejected ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
          <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ${approved ? "text-emerald-700" : rejected ? "text-red-700" : "text-amber-700"}`}>
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-serif text-2xl font-bold text-[#17365f]">
            {statusTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {statusDescription}
          </p>
          <Button
            type="button"
            onClick={onComplete ?? onBackToSignIn}
            className="mt-5 h-auto rounded-xl bg-[#17365f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102a4c]"
          >
            Continue to AUR
          </Button>
        </div>
      );
    }

    return (
      <section className="mx-auto flex w-full max-w-3xl grow items-center px-4 py-12">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_70px_-36px_rgba(15,42,76,0.45)] sm:p-12">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
            Application received
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-[#17365f]">
            Your institution is under review
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            {statusDescription}
          </p>
          <Button
            type="button"
            onClick={onComplete ?? onBackToSignIn}
            className="mt-7 h-auto rounded-xl bg-[#17365f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#102a4c]"
          >
            Continue to AUR
          </Button>
        </div>
      </section>
    );
  }

  if (authMode === "login" && !currentUser) {
    return (
      <div className="space-y-5">
        <Button
          type="button"
          variant="outline"
          disabled={googleLoading || submitting}
          onClick={handleGoogleAuthentication}
          className="h-auto w-full gap-3 rounded-xl border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#17365f] hover:bg-slate-50"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleMark />
          )}
          {googleLoading ? "Connecting…" : "Continue with Google as Institution"}
        </Button>
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            or use work email
          </span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <form onSubmit={handleInstitutionLogin} className="space-y-4">
          <FormField id="institution-login-email" label="Work email" icon={Mail}>
            <Input
              id="institution-login-email"
              type="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              required
              autoComplete="email"
              className="h-11"
            />
          </FormField>
          <FormField id="institution-login-password" label="Password" icon={Lock}>
            <Input
              id="institution-login-password"
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="h-11"
            />
          </FormField>
          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={submitting}
            className="h-auto w-full gap-2 rounded-xl bg-[#17365f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#102a4c]"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Signing in…" : "Sign in as Institution"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <section className={embedded ? "w-full" : "mx-auto w-full max-w-6xl px-4 py-8 sm:py-12"}>
      <div className={embedded ? "w-full" : "overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_-36px_rgba(15,42,76,0.45)]"}>
        <div className={embedded ? "block" : "grid lg:grid-cols-[0.78fr_1.22fr]"}>
          {!embedded && <div className="relative overflow-hidden bg-[linear-gradient(145deg,#102a4c_0%,#1b416d_100%)] p-8 text-white sm:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
            <Building2 className="h-10 w-10 text-amber-400" />
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
              AUR institutional access
            </p>
            <h1 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl">
              Register your institution
            </h1>
            <p className="mt-4 text-sm leading-6 text-blue-100/80">
              Submit an official profile for verification. Institutional billing and
              management tools become available only after approval.
            </p>
            <div className="mt-8 space-y-4 text-sm text-blue-50">
              {[
                "Verified institution profile",
                "Ranking data management",
                "Institution-only plans and billing",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>}

          <form onSubmit={handleSubmit} className={embedded ? "w-full" : "p-6 sm:p-10"}>
            {!currentUser && (
              <div className="mb-7">
                <Button
                  type="button"
                  variant="outline"
                  disabled={googleLoading || submitting}
                  onClick={handleGoogleAuthentication}
                  className="h-auto w-full gap-3 rounded-xl border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#17365f] hover:bg-slate-50"
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleMark />
                  )}
                  {googleLoading ? "Connecting…" : "Continue with Google as Institution"}
                </Button>
                <p className="mt-2 text-center text-xs leading-5 text-slate-500">
                  Google verifies the representative account. Institution details still
                  require AUR review.
                </p>
                <div className="mt-5 flex items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    or use work email
                  </span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="institution-name"
                label="Institution name"
                icon={GraduationCap}
                className="sm:col-span-2"
              >
                <Input
                  id="institution-name"
                  value={form.institutionName}
                  onChange={(event) => updateField("institutionName", event.target.value)}
                  required
                  maxLength={160}
                  placeholder="Official university or institution name"
                  className="h-11"
                />
              </FormField>

              <FormField id="institution-type" label="Institution type" icon={Building2}>
                <select
                  id="institution-type"
                  value={form.institutionType}
                  onChange={(event) => updateField("institutionType", event.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option>University</option>
                  <option>College</option>
                  <option>Research institute</option>
                  <option>Higher education network</option>
                </select>
              </FormField>

              <FormField id="country" label="Country" icon={MapPin}>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  required
                  maxLength={100}
                  placeholder="Country"
                  className="h-11"
                />
              </FormField>

              <FormField id="website" label="Official website" icon={Globe2}>
                <Input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(event) => updateField("website", event.target.value)}
                  required
                  maxLength={250}
                  placeholder="https://university.edu"
                  className="h-11"
                />
              </FormField>

              <FormField id="accreditation-id" label="Accreditation / registry ID" icon={Building2}>
                <Input
                  id="accreditation-id"
                  value={form.accreditationId}
                  onChange={(event) => updateField("accreditationId", event.target.value)}
                  required
                  maxLength={100}
                  placeholder="Official registration ID"
                  className="h-11"
                />
              </FormField>

              <FormField id="representative-name" label="Representative name" icon={UserRound}>
                <Input
                  id="representative-name"
                  value={form.representativeName}
                  onChange={(event) => updateField("representativeName", event.target.value)}
                  required
                  maxLength={100}
                  placeholder="Full name"
                  className="h-11"
                />
              </FormField>

              <FormField id="representative-email" label="Official work email" icon={Mail}>
                <Input
                  id="representative-email"
                  type="email"
                  value={form.representativeEmail}
                  onChange={(event) => updateField("representativeEmail", event.target.value)}
                  required
                  maxLength={254}
                  disabled={Boolean(currentUser)}
                  placeholder="name@university.edu"
                  className="h-11"
                />
              </FormField>

              {!currentUser && (
                <FormField
                  id="institution-password"
                  label="Account password"
                  icon={Lock}
                  className="sm:col-span-2"
                >
                  <Input
                    id="institution-password"
                    type="password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className="h-11"
                  />
                </FormField>
              )}
            </div>

            {currentUser && (
              <p className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900">
                This application will be linked to {currentUser.email}.
              </p>
            )}

            {error && (
              <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className={`mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center ${embedded ? "sm:justify-end" : "sm:justify-between"}`}>
              {!embedded && <button
                  type="button"
                  onClick={onBackToSignIn}
                  className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-[#17365f] hover:underline"
                >
                  Back to account type
                </button>}
              <Button
                type="submit"
                disabled={submitting}
                className="h-auto gap-2 rounded-xl bg-[#17365f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#102a4c]"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                {submitting ? "Submitting…" : "Submit for verification"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.37l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.92A6 6 0 0 1 6.08 12c0-.67.12-1.32.31-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.61.39 3.13 1.04 4.54l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z" />
    </svg>
  );
}

function FormField({
  id,
  label,
  icon: Icon,
  className = "",
  children,
}: {
  id: string;
  label: string;
  icon: typeof Building2;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
        <Icon className="h-3.5 w-3.5 text-amber-600" />
        {label}
      </Label>
      {children}
    </div>
  );
}
