"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Lock, X } from "lucide-react";

interface AuthGateContextValue {
  /** True when a valid access token is present. */
  isAuthenticated: boolean;
  /** True until the first auth check completes (avoids logged-out flash). */
  authReady: boolean;
  /**
   * Gate an action behind authentication. If the user is signed in, `action`
   * runs immediately and `requireAuth` returns true. Otherwise a sign-in dialog
   * is shown (optionally with a contextual reason) and it returns false.
   */
  requireAuth: (action?: () => void, reason?: string) => boolean;
  /** Open the sign-in dialog directly (e.g. for a "locked" affordance). */
  promptSignIn: (reason?: string) => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

const DEFAULT_REASON = "Sign in to unlock this feature.";

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [dialogReason, setDialogReason] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setIsAuthenticated(Boolean(sessionStorage.getItem("aur_access_token")));
      setAuthReady(true);
    };
    sync();
    window.addEventListener("aur-auth-change", sync);
    return () => window.removeEventListener("aur-auth-change", sync);
  }, []);

  const promptSignIn = useCallback((reason?: string) => {
    setDialogReason(reason ?? DEFAULT_REASON);
  }, []);

  const requireAuth = useCallback(
    (action?: () => void, reason?: string) => {
      if (isAuthenticated) {
        action?.();
        return true;
      }
      setDialogReason(reason ?? DEFAULT_REASON);
      return false;
    },
    [isAuthenticated]
  );

  const closeDialog = useCallback(() => setDialogReason(null), []);

  const goToAuth = useCallback(
    (mode: "login" | "signup") => {
      setDialogReason(null);
      router.push(`?view=login&mode=${mode}`);
    },
    [router]
  );

  return (
    <AuthGateContext.Provider
      value={{ isAuthenticated, authReady, requireAuth, promptSignIn }}
    >
      {children}
      {dialogReason !== null && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="authgate-title"
          onClick={closeDialog}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeDialog}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A365D]/10 text-[#1A365D]">
              <Lock className="h-6 w-6" />
            </div>

            <h2
              id="authgate-title"
              className="font-serif text-2xl font-bold text-[#1A365D]"
            >
              Create a free account
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {dialogReason}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => goToAuth("signup")}
                className="w-full rounded-lg bg-[#1A365D] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-900"
              >
                Sign Up — it&apos;s free
              </button>
              <button
                type="button"
                onClick={() => goToAuth("login")}
                className="w-full rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-[#1A365D] transition-colors hover:bg-slate-50"
              >
                I already have an account
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    throw new Error("useAuthGate must be used within AuthGateProvider");
  }
  return ctx;
}
