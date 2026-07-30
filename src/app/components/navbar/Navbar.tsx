"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X, ChevronDown, User, Shield, Settings, LogOut } from "lucide-react";
import { BrandLogo } from "../BrandLogo";
import { useRouter } from "next/navigation";
import { useSidebar } from "../navigation/SidebarContext";
import { TOP_NAV_LINKS } from "../navigation/config";
import { authenticatedFetch } from "../../lib/authenticated-fetch";
import { firebaseAuth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AuthenticatedUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  isAdmin: boolean;
  profile_photo: string | null;
};

interface NavbarProps {
  isAuthenticated?: boolean;
  onLogIn?: () => void;
  onSignUp?: () => void;
  onSignOut?: () => void;
}

export default function Navbar({
  isAuthenticated = true,
  onLogIn,
  onSignUp,
  onSignOut,
}: NavbarProps) {
  const router = useRouter();
  const {
    isMobileOpen,
    setIsMobileOpen,
    activeView,
    handleViewChange,
  } = useSidebar();

  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Fetch the real logged-in user's profile
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchCurrentUser(user = firebaseAuth.currentUser) {
      if (!user) {
        setCurrentUser(null);
        return;
      }
      try {
        const response = await authenticatedFetch("/api/account");
        const payload = (await response.json()) as {
          profile?: Record<string, unknown>;
        };
        const data = payload.profile ?? {};
        // Admin rights come from the Firebase `admin` custom claim (the same
        // check the admin API enforces) — there is no `role` column on
        // aur_user_profiles, so reading one would never surface the console.
        const tokenResult = await user.getIdTokenResult();
        setCurrentUser({
          id: user.uid,
          email: user.email ?? String(data.email ?? ""),
          first_name: String(data.first_name ?? user.displayName?.split(" ")[0] ?? "AUR"),
          last_name: String(data.last_name ?? user.displayName?.split(" ").slice(1).join(" ") ?? ""),
          isAdmin: tokenResult.claims.admin === true,
          profile_photo:
            typeof data.profile_photo === "string"
              ? data.profile_photo
              : user.photoURL,
        });
      } catch (error) {
        console.error("Unable to load signed-in user:", error);
        setCurrentUser(null);
      }
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, fetchCurrentUser);
    const refreshCurrentUser = () => void fetchCurrentUser();
    window.addEventListener("aur-profile-change", refreshCurrentUser);
    return () => {
      unsubscribe();
      window.removeEventListener("aur-profile-change", refreshCurrentUser);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [currentUser?.profile_photo]);

  const displayName = currentUser
    ? [currentUser.first_name, currentUser.last_name === "-" ? "" : currentUser.last_name].filter(Boolean).join(" ")
    : "Loading profile...";

  const initials = currentUser
    ? `${currentUser.first_name[0] ?? ""}${currentUser.last_name !== "-" ? currentUser.last_name[0] ?? "" : ""}`.toUpperCase()
    : "...";

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white"
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    >
      <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">

          {/* ── Logo — crystal clear, merged flush into bar ── */}
          <button
            type="button"
            onClick={() => handleViewChange("home")}
            aria-label="Asia University Rankings — go to homepage"
            className="flex items-center cursor-pointer shrink-0 select-none h-16"
          >
            <BrandLogo theme="dark" />
          </button>

          {/* ── Vertical divider ── */}
          <div className="hidden md:block h-6 w-px bg-slate-200 shrink-0 mx-2" />

          {/* ── Navigation Links - Desktop ── */}
          <nav className="hidden lg:flex space-x-1 items-center">
            {TOP_NAV_LINKS.map((link) => {
              const isActive = activeView === link.view;

              return (
                <Button
                  key={link.label}
                  variant="ghost"
                  onClick={() => handleViewChange(link.view)}
                  className={`relative h-auto rounded-none border-0 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 hover:bg-transparent after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-aur-primary after:transition-transform after:duration-300 after:origin-left ${
                    isActive
                      ? "text-aur-primary hover:text-aur-primary after:scale-x-100"
                      : "text-aur-primary/80 hover:text-aur-primary after:scale-x-0 hover:after:scale-x-100"
                  }`}
                >
                  {link.label}
                </Button>
              );
            })}
          </nav>

          {/* ── Spacer ── */}
          <div className="flex-1 hidden lg:block" />

          {/* ── Push icons to far right ── */}
          <div className="flex-1" />

          {/* ── Action icons ── */}
          <div className="flex items-center gap-1">

            {!isAuthenticated && (
              <div className="hidden items-center gap-1 sm:flex">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onLogIn}
                  className="relative h-auto rounded-none border-0 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-aur-primary transition-all duration-300 hover:bg-transparent hover:text-aur-primary/80 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-aur-primary after:transition-transform after:duration-300 hover:after:scale-x-100"
                >
                  Log In
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSignUp}
                  className="relative h-auto rounded-none border-0 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-aur-primary transition-all duration-300 hover:bg-transparent hover:text-aur-primary/80 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-aur-primary after:transition-transform after:duration-300 hover:after:scale-x-100"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Profile avatar */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label="Open profile menu"
                    className="group flex h-auto items-center gap-1.5 rounded-none border-0 p-0 hover:bg-transparent aria-expanded:bg-transparent focus-visible:ring-0 focus-visible:border-transparent"
                  >
                    <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-aur-primary text-[11px] font-bold tracking-wide text-white shadow-sm ring-1 ring-slate-200 transition-transform duration-200 group-hover:scale-105">
                      {currentUser?.profile_photo && !avatarFailed ? (
                        <Image
                          src={currentUser.profile_photo}
                          alt=""
                          fill
                          unoptimized
                          referrerPolicy="no-referrer"
                          sizes="36px"
                          className="object-cover"
                          onError={() => setAvatarFailed(true)}
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <ChevronDown className="size-3 text-slate-600 group-hover:text-slate-900 transition-colors hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-52 rounded-none border border-[var(--aur-border)] ring-0 bg-[var(--aur-surface)] shadow-xl p-0 py-1.5"
                >
                  <div className="px-4 py-3 border-b border-[var(--aur-border)]">
                    <span className="block font-bold text-[var(--aur-text)] text-sm">{displayName}</span>
                    <span className="block text-[10px] text-[var(--aur-text-muted)] mt-0.5 break-all">{currentUser?.email ?? "Fetching account details"}</span>
                  </div>
                  {[
                    { label: "My Profile", icon: User, action: () => handleViewChange("profile") },
                    // The console is a real route, not an in-app view — a
                    // `?view=admin` push would render an empty page.
                    ...(currentUser?.isAdmin ? [{ label: "Admin Console", icon: Shield, action: () => router.push("/admin/dashboard") }] : []),
                    { label: "Settings", icon: Settings, action: () => handleViewChange("settings") },
                  ].map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      onSelect={() => item.action()}
                      className="w-full cursor-pointer rounded-none px-4 py-2.5 text-xs text-[var(--aur-text-secondary)] focus:bg-[var(--aur-hover)] focus:text-[var(--aur-text)] flex items-center gap-2.5 transition-colors"
                    >
                      <item.icon className="size-3.5 text-[var(--aur-text-muted)]" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                  <div className="border-t border-[var(--aur-border)] my-1" />
                  <DropdownMenuItem
                    onSelect={() => {
                      setCurrentUser(null);
                      onSignOut?.();
                    }}
                    className="w-full cursor-pointer rounded-none px-4 py-2.5 text-xs text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="size-3.5 text-red-500" />
                    <span className="font-semibold">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile hamburger */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label={isMobileOpen ? "Close menu" : "Open menu"}
              className="h-auto w-auto rounded-md border-0 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 md:hidden ml-1"
            >
              {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>

          </div>
        </div>
      </div>
    </header>
  );
}
