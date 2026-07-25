"use client";

import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const PROMPT_DELAY_MS = 8_000;
const DISMISSED_KEY = "aur_join_prompt_dismissed";

interface DiscoveryJoinModalProps {
  onLogIn: () => void;
  onSignUp: () => void;
  onClose?: () => void;
}

/**
 * Non-blocking sign-up prompt: a slim dismissible banner instead of a modal.
 * Appears after the visitor starts scrolling (plus a delay), and once
 * dismissed it stays hidden for the rest of the session.
 */
export default function DiscoveryJoinModal({
  onLogIn,
  onSignUp,
  onClose,
}: DiscoveryJoinModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    let timer: number | undefined;

    const startPromptTimer = () => {
      if (timer !== undefined) return;
      timer = window.setTimeout(() => setIsOpen(true), PROMPT_DELAY_MS);
      window.removeEventListener("scroll", startPromptTimer);
    };

    window.addEventListener("scroll", startPromptTimer, { passive: true });

    return () => {
      window.removeEventListener("scroll", startPromptTimer);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <section
      role="region"
      aria-label="Create a free account"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-2xl flex-col gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(7,26,47,0.18)] sm:flex-row sm:items-center sm:p-4"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#d8a12e] via-amber-400 to-[#1a365d]" />
      <p className="flex-1 pr-8 text-sm leading-snug text-slate-700 sm:pr-0">
        <span className="font-bold text-[#122b49]">Keep your shortlist.</span>{" "}
        A free account saves universities and comparisons across visits.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          onClick={() => {
            sessionStorage.setItem(DISMISSED_KEY, "1");
            onSignUp();
          }}
          className="h-auto border-0 bg-[#1a365d] px-4 py-2 text-xs font-bold text-white hover:bg-[#254a78] active:translate-y-0!"
        >
          Sign up free
          <ArrowRight className="size-3.5" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            sessionStorage.setItem(DISMISSED_KEY, "1");
            onLogIn();
          }}
          className="h-auto px-3 py-2 text-xs font-bold text-[#1a365d] hover:bg-slate-100 active:translate-y-0!"
        >
          Log in
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={dismiss}
        aria-label="Dismiss sign-up prompt"
        className="absolute top-2.5 right-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 sm:static sm:ml-1"
      >
        <X className="size-4" aria-hidden />
      </Button>
    </section>
  );
}
