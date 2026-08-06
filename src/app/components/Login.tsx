"use client";

import "./Login.css";
import React, { useState } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  setPersistence,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Shield,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Network,
  Activity,
  CheckCircle2,
  Building2,
  GraduationCap,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { useSidebar } from "./navigation/SidebarContext";
import { useUniversityData } from "./data/UniversityDataProvider";
import { CanvasRevealEffect } from "./ui/canvas-reveal-effect";
import LoginGlobe from "./LoginGlobe";
import InstitutionRegistration from "./InstitutionRegistration";
import { authenticatedFetch } from "../lib/authenticated-fetch";
import { firebaseAuth } from "../lib/firebase";
import { authErrorMessage } from "../lib/auth-error-message";

// ─── Variants ─────────────────────────────────────────────────────────────────
const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const panelLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.9, ease } },
};
const panelRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, delay: 0.15, ease } },
};
const formIn = (dir: number) => ({ opacity: 0, x: dir * 28 });
const formAnim = { opacity: 1, x: 0, transition: { duration: 0.4, ease } };
const formOut = (dir: number) => ({ opacity: 0, x: dir * -28, transition: { duration: 0.26, ease: [0.4,0,1,1] as [number,number,number,number] } });

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.4 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

// ─── Password strength ────────────────────────────────────────────────────────
function pwStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: 1, label: "Weak",      color: "#ef4444" };
  if (s <= 2) return { score: 2, label: "Fair",      color: "#f97316" };
  if (s <= 3) return { score: 3, label: "Good",      color: "#eab308" };
  if (s <= 4) return { score: 4, label: "Strong",    color: "#22c55e" };
  return       { score: 5, label: "Excellent", color: "#10b981" };
}


// ─── Floating Data Chip ───────────────────────────────────────────────────────
function Chip({ icon: Icon, value, label, delay, className = "" }:
  { icon: any; value: string; label: string; delay: number; className?: string }) {
  return (
    <div 
      
      
      
      className={`lp-chip ${className}`}
    >
      <div className="lp-chip-icon"><Icon size={16}/></div>
      <div>
        <div className="lp-chip-value">{value}</div>
        <div className="lp-chip-label">{label}</div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Login({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const { handleViewChange} = useSidebar();
  const { totalCount, totalCountries, loading: dataLoading } = useUniversityData();

  const [isLogin, setIsLogin]             = useState(initialMode === "login");
  const [dir, setDir]                     = useState(1);
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [name, setName]                   = useState("");
  const [confirmPw, setConfirmPw]         = useState("");
  const [showPw, setShowPw]               = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [keepIn, setKeepIn]               = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [registrationType, setRegistrationType] = useState<"student" | "institution">("student");

  const strength   = pwStrength(password);
  const pwsMatch   = confirmPw === "" || password === confirmPw;

  const switchMode = (toLogin: boolean) => {
    setDir(toLogin ? -1 : 1);
    setIsLogin(toLogin);
    setError("");
    setPassword("");
    setConfirmPw("");
    setRegistrationType("student");
  };

  const saveUserProfile = async (
    user: FirebaseUser,
    fallbackName = "",
    accountType?: "student",
  ) => {
    const displayName = user.displayName?.trim() || fallbackName.trim();
    await authenticatedFetch("/api/account");
    if (accountType) {
      await authenticatedFetch("/api/account", {
        method: "PUT",
        body: JSON.stringify({
          name: displayName,
          country: "",
          profile_role: "Student",
          profile_photo: user.photoURL,
        }),
      });
    }
  };

  const finishAuthentication = async (
    user: FirebaseUser,
    accountType?: "student",
  ) => {
    await saveUserProfile(user, name, accountType);
    handleViewChange("home");
  };

  const isInstitutionAccount = async (user: FirebaseUser) => {
    void user;
    const response = await authenticatedFetch("/api/account");
    const account = (await response.json()) as {
      profile?: { account_type?: string };
    };
    return account.profile?.account_type === "institution";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1. Basic Frontend Validation & Sanitization
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!isLogin) {
      if (!pwsMatch) {
        setError("Passwords do not match.");
        return;
      }
      if (strength.score < 3) {
        setError("Please choose a stronger password for better security.");
        return;
      }
      if (!name.trim()) {
        setError("Full Name is required for registration.");
        return;
      }
    }

    setLoading(true);

    try {
      await setPersistence(
        firebaseAuth,
        keepIn ? browserLocalPersistence : browserSessionPersistence,
      );
      const credential = isLogin
        ? await signInWithEmailAndPassword(firebaseAuth, email.trim(), password)
        : await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);

      if (isLogin && await isInstitutionAccount(credential.user)) {
        await signOut(firebaseAuth);
        setError("This is an institution account. Choose Institution to sign in.");
        return;
      }

      if (!isLogin) {
        await updateProfile(credential.user, { displayName: name.trim() });
      }

      await finishAuthentication(credential.user, isLogin ? undefined : "student");
    } catch (err: unknown) {
      setError(authErrorMessage(err, isLogin ? "email-login" : "signup"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await setPersistence(
        firebaseAuth,
        keepIn ? browserLocalPersistence : browserSessionPersistence,
      );
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(firebaseAuth, provider);
      if (isLogin && await isInstitutionAccount(credential.user)) {
        await signOut(firebaseAuth);
        setError("This is an institution account. Choose Institution to sign in.");
        return;
      }
      await finishAuthentication(credential.user, isLogin ? undefined : "student");
    } catch (err: unknown) {
      setError(authErrorMessage(err, "google"));
    } finally {
      setLoading(false);
    }
  };

  // Real dataset facts — the same trust numbers the homepage cites.
  const chips = [
    { icon: BarChart3, value: dataLoading || !totalCount ? "—" : totalCount.toLocaleString(), label: "Universities ranked", delay: 0.2, cls: "lp-chip-1" },
    { icon: Network,   value: dataLoading || !totalCountries ? "—" : String(totalCountries),  label: "Countries & territories", delay: 0.4, cls: "lp-chip-2" },
    { icon: Activity,  value: "11",                                                     label: "Weighted indicators", delay: 0.6, cls: "lp-chip-3" },
  ];

  return (
    <div className="lp-root relative">
      {/* Dark mode: animated dot matrix canvas background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <CanvasRevealEffect
            animationSpeed={3}
            containerClassName="bg-cyber-black"
            colors={[
              [255, 255, 255],
              [255, 255, 255],
            ]}
            dotSize={6}
            reverse={false}
            showGradient={false}
          />
          {/* Radial vignette so center stays dark and readable */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(127, 86, 217, 0.85)_0%,_transparent_70%)]" />
          {/* Top fade */}
          <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-cyber-black to-transparent" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-cyber-black to-transparent" />
        </div>
      <div className="lp-bg-grid relative z-10"/>

      {/* ── Left Showcase ── */}
      <div className="lp-left relative z-10"   >
        {/* Logo — click returns to the home page */}
        <div className="lp-logo pt-8 pl-8">
          <button
            type="button"
            onClick={() => handleViewChange("home")}
            aria-label="Go to home page"
            className="cursor-pointer bg-transparent border-0 p-0"
          >
            <BrandLogo variant="dark-bg" width={280} displayHeight={60} />
          </button>
        </div>

        {/* Intelligence Graphic */}
        <div className="lp-intel-stage">
          <div className="lp-map-wrapper" style={{ width: "100%", height: "100%", display: "flex" }}>
            <LoginGlobe />
          </div>
          {chips.map((c) => (
            <Chip key={c.label} icon={c.icon} value={c.value} label={c.label} delay={c.delay} className={c.cls}/>
          ))}
        </div>

        {/* Hero copy */}
        <div className="lp-hero"   >
          <div className="lp-hero-eyebrow" >
            Asia University Rankings
          </div>
          <h2 className="lp-hero-title">
            Every university.<br/>
            <span>One honest formula.</span>
          </h2>
          <div className="lp-trust-row" >
            {["Save shortlists", "Compare side by side", "Free forever"].map(t => (
              <div key={t} className="lp-trust-badge">
                <div className="lp-trust-dot"/>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form ── */}
      <div className="lp-right relative z-10"   >
        <div className={`lp-glass-card ${registrationType === "institution" ? "lp-glass-card-wide" : ""}`}>
          {/* Mobile brand — click returns to the home page */}
          <div className="lp-mobile-brand">
            <div className="lp-logo mb-6 origin-left">
              <button
                type="button"
                onClick={() => handleViewChange("home")}
                aria-label="Go to home page"
                className="cursor-pointer bg-transparent border-0 p-0"
              >
                <BrandLogo theme="dark" width={240} displayHeight={56} />
              </button>
            </div>
          </div>

          {/* Animated form swap */}
          <>
            <div
              key={isLogin ? "login" : "signup"}
              className="lp-form-anim-wrapper"
            >
              {/* Header */}
              <div className="lp-form-header">
                <h1 className="lp-form-title">
                  {isLogin && registrationType === "student"
                    ? "Welcome back"
                    : isLogin && registrationType === "institution"
                      ? "Institution sign in"
                      : registrationType === "institution"
                      ? "Register your institution"
                      : "Create your free account"}
                </h1>
                <p className="lp-form-sub">
                  {isLogin && registrationType === "student"
                    ? "Pick up your shortlists and comparisons where you left off."
                    : isLogin && registrationType === "institution"
                      ? "Sign in to resume an application or check its verification status."
                      : registrationType === "institution"
                      ? "Verify a representative account and submit official institution details for review."
                      : "Save universities, compare side by side, and keep your research in one place."}
                </p>
              </div>

              {(
                <div className="mb-5">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {isLogin ? "I am signing in as" : "I am registering as"}
                  </p>
                  <div className="grid grid-cols-2 gap-3" role="group" aria-label="Choose account type">
                    <button
                      type="button"
                      aria-pressed={registrationType === "student"}
                      onClick={() => setRegistrationType("student")}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                        registrationType === "student"
                          ? "border-2 border-[#17365f] bg-blue-50 text-[#17365f]"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-[#17365f]/50"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#17365f] text-white">
                        <GraduationCap className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-xs font-bold">Student</span>
                        <span className="mt-0.5 block text-[10px] text-slate-500">Personal account</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={registrationType === "institution"}
                      onClick={() => setRegistrationType("institution")}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                        registrationType === "institution"
                          ? "border-2 border-amber-500 bg-amber-50 text-amber-950"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:bg-amber-50"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-xs font-bold">Institution</span>
                        <span className="mt-0.5 block text-[10px] text-slate-500">Official profile</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {registrationType === "institution" && (
                <InstitutionRegistration
                  embedded
                  authMode={isLogin ? "login" : "signup"}
                  onBackToSignIn={() => setRegistrationType("student")}
                  onComplete={() => handleViewChange("home")}
                />
              )}

              {registrationType === "student" && <>
              {/* Form */}
              <form className="lp-form" onSubmit={handleSubmit}>
                {/* Name field (signup only) */}
                {!isLogin && (
                  <div className="lp-field">
                    <Label htmlFor="lp-name" className="lp-label leading-normal select-auto">Full Name</Label>
                    <div className="lp-input-wrap">
                      <User size={16} className="lp-input-icon"/>
                      <Input
                        id="lp-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Dr. Jane Smith"
                        required={!isLogin}
                        autoComplete="name"
                        className="lp-input h-auto"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="lp-field">
                  <Label htmlFor="lp-email" className="lp-label leading-normal select-auto">
                    {isLogin ? "Email or username" : "Email address"}
                  </Label>
                  <div className="lp-input-wrap">
                    <Mail size={16} className="lp-input-icon"/>
                    <Input
                      id="lp-email"
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={isLogin ? "email or username" : "you@example.com"}
                      required
                      autoComplete="email"
                      className="lp-input h-auto"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="lp-field">
                  <Label htmlFor="lp-password" className="lp-label leading-normal select-auto">Password</Label>
                  <div className="lp-input-wrap">
                    <Lock size={16} className="lp-input-icon"/>
                    <Input
                      id="lp-password"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      className="lp-input h-auto"
                    />
                    <button type="button" className="lp-eye-btn" onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}>
                      {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>

                  {/* Strength bar (sign-up only) */}
                  {!isLogin && password && (
                    <div className="lp-strength-row">
                      <div className="lp-strength-bars">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="lp-strength-bar"
                            style={{ background: i <= strength.score ? strength.color : undefined }}/>
                        ))}
                      </div>
                      <span className="lp-strength-text" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm password (signup only) */}
                {!isLogin && (
                  <div className="lp-field">
                    <Label htmlFor="lp-confirm" className="lp-label leading-normal select-auto">Confirm Password</Label>
                    <div className="lp-input-wrap">
                      <Lock size={16} className="lp-input-icon"/>
                      <Input
                        id="lp-confirm"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPw}
                        onChange={e => setConfirmPw(e.target.value)}
                        placeholder="••••••••"
                        required={!isLogin}
                        autoComplete="new-password"
                        className="lp-input h-auto"
                        style={!pwsMatch ? { borderColor: "#fca5a5", backgroundColor: "#fef2f2" } : undefined}
                      />
                      <button type="button" className="lp-eye-btn" onClick={() => setShowConfirm(v => !v)}>
                        {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                    {!pwsMatch && (
                      <div className="lp-field-error">
                        <AlertCircle size={14}/> Passwords do not match
                      </div>
                    )}
                  </div>
                )}

                {/* Remember / Forgot (login only) */}
                {isLogin && (
                  <div className="lp-remember-row">
                    <Label className="lp-checkbox-label leading-normal select-auto" htmlFor="lp-keepin">
                      <Checkbox
                        id="lp-keepin"
                        checked={keepIn}
                        onCheckedChange={checked => setKeepIn(checked === true)}
                        className="lp-checkbox shrink-0 data-checked:bg-[#E8A020] data-checked:text-white dark:bg-transparent"
                      />
                      Keep me signed in
                    </Label>
                    <button type="button" className="lp-forgot">Forgot password?</button>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <Alert variant="destructive" className="lp-error-banner *:[svg]:translate-y-0">
                    <AlertCircle size={16} style={{ flexShrink: 0 }}/>
                    {error}
                  </Alert>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading || (!isLogin && !pwsMatch && confirmPw !== "")}
                  className="lp-submit h-auto active:not-aria-[haspopup]:translate-y-0 disabled:pointer-events-auto"
                >
                  <span className="lp-submit-inner">
                    {loading ? (
                      <><div className="lp-spinner"/> Authenticating…</>
                    ) : (
                      <>{isLogin ? "Sign In" : "Create Account"} <ArrowRight size={16}/></>
                    )}
                  </span>
                </Button>

              </form>

              <div className="lp-divider" aria-hidden="true">
                <span className="lp-divider-line" />
                <span className="lp-divider-text">or continue with</span>
                <span className="lp-divider-line" />
              </div>

              <div className="lp-social-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                  className="lp-social-btn h-auto disabled:pointer-events-auto"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
                    <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.37l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
                    <path fill="#FBBC05" d="M6.39 13.92A6 6 0 0 1 6.08 12c0-.67.12-1.32.31-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.61.39 3.13 1.04 4.54l3.35-2.62Z" />
                    <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z" />
                  </svg>
                  Continue with Google as Student
                </Button>
              </div>

              {/* Footer toggle */}
              <div className="lp-footer">
                {isLogin ? (
                  <>Don&apos;t have an account?{" "}
                    <button className="lp-footer-btn" onClick={() => switchMode(false)}>Sign up free</button>
                  </>
                ) : (
                  <>Already have an account?{" "}
                    <button className="lp-footer-btn" onClick={() => switchMode(true)}>Sign in</button>
                  </>
                )}
              </div>
              </>}
            </div>
          </>
        </div>
      </div>
    </div>
  );
}
