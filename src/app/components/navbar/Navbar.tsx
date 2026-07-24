"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Bell, Menu, X, ChevronDown, User, Shield, LogOut } from "lucide-react";
import { BrandLogo } from "../BrandLogo";
import { useSidebar } from "../navigation/SidebarContext";
import { useToast } from "../feedback/ToastContext";
import { TOP_NAV_LINKS } from "../navigation/config";
import { API_BASE_URL } from "../../lib/universities";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  is_read: boolean;
  created_at: string;
};

type AuthenticatedUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
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
  const { showToast } = useToast();
  const {
    isMobileOpen,
    setIsMobileOpen,
    activeView,
    handleViewChange,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
  } = useSidebar();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);

  // Fetch the real logged-in user's profile
  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();

    async function fetchCurrentUser() {
      const token = sessionStorage.getItem("aur_access_token");
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch signed-in user");
        setCurrentUser(await response.json());
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Unable to load signed-in user:", error);
        setCurrentUser(null);
      }
    }

    fetchCurrentUser();
    window.addEventListener("aur-profile-change", fetchCurrentUser);
    return () => {
      controller.abort();
      window.removeEventListener("aur-profile-change", fetchCurrentUser);
    };
  }, [isAuthenticated]);

  // Fetch notifications once on mount (for the unread badge) and refresh when
  // the menu is opened; closing the menu does not refetch.
  const hasFetchedNotifs = useRef(false);
  useEffect(() => {
    if (hasFetchedNotifs.current && !showNotifMenu) return;
    hasFetchedNotifs.current = true;

    const controller = new AbortController();

    async function fetchNotifications() {
      const token = sessionStorage.getItem("aur_access_token");
      if (!token) {
        setNotifications([]);
        setNotifLoading(false);
        return;
      }

      setNotifLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        setNotifications(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setNotifications([]);
      } finally {
        setNotifLoading(false);
      }
    }
    fetchNotifications();

    return () => controller.abort();
  }, [showNotifMenu]);

  function timeAgo(dateString: string) {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  async function markAsRead(id: string) {
    try {
      const token = sessionStorage.getItem("aur_access_token");
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
            {TOP_NAV_LINKS.filter(link => isAuthenticated || link.view !== "saved").map((link) => {
              const isActive = activeView === link.view;

              if (link.view === "news") {
                return (
                  <Link
                    key={link.label}
                    href="/news"
                    className="relative px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 rounded-none text-aur-primary hover:text-aur-primary/80 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-aur-primary after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
                  >
                    {link.label}
                  </Link>
                );
              }

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
                <a
                  href="/admin/login"
                  className="relative px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400/90 transition-all duration-300 hover:text-amber-400 mr-2 border border-amber-400/30 rounded hover:bg-amber-400/10"
                >
                  Admin Console
                </a>
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

            {/* Notification bell */}
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                <a
                  href="/admin/login"
                  className="hidden sm:inline-flex relative px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400/90 transition-all duration-300 hover:text-amber-400 border border-amber-400/30 rounded hover:bg-amber-400/10"
                >
                  Admin Console
                </a>
                <DropdownMenu onOpenChange={setShowNotifMenu}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label="Open notifications"
                      className="relative h-auto w-auto rounded-md border-0 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 aria-expanded:bg-slate-100 aria-expanded:text-slate-900 transition-all duration-200"
                    >
                      <Bell className="size-4" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-80 rounded-none border border-[var(--aur-border)] ring-0 bg-[var(--aur-surface)] shadow-xl p-0 py-2 text-xs text-[var(--aur-text-secondary)]"
                  >
                    <div className="px-4 py-2.5 border-b border-[var(--aur-border)] flex justify-between items-center">
                      <span className="font-bold text-[var(--aur-text)] uppercase tracking-wider text-[10px]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] text-red-500 font-semibold">{unreadCount} New</span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-[var(--aur-border)]">
                      {notifLoading ? (
                        <div className="px-4 py-6 text-center text-[10px] text-[var(--aur-text-muted)]">
                          Loading...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-[10px] text-[var(--aur-text-muted)]">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`px-4 py-3 hover:bg-[var(--aur-hover)] transition-colors cursor-pointer ${
                              !n.is_read ? "bg-[var(--aur-surface-2)]" : ""
                            }`}
                          >
                            <div className="flex justify-between mb-0.5">
                              <span className="font-semibold text-[var(--aur-text)] text-[11px]">{n.title}</span>
                              <span className="text-[9px] text-[var(--aur-text-muted)] shrink-0 ml-2">
                                {timeAgo(n.created_at)}
                              </span>
                            </div>
                            <p className="text-[10px] text-[var(--aur-text-muted)] leading-relaxed">{n.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Divider */}
            {isAuthenticated && <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />}

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
                    <div className="h-8 w-8 rounded-full bg-aur-primary flex items-center justify-center text-white text-[11px] font-bold tracking-wide transition-transform duration-200 group-hover:scale-105">
                      {initials}
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
                    ...(currentUser?.role === "admin" ? [{ label: "Admin Console", icon: Shield, action: () => handleViewChange("admin") }] : []),
                    { label: "Settings", icon: Shield, action: () => handleViewChange("settings") },
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
                      sessionStorage.removeItem("aur_access_token");
                      sessionStorage.removeItem("aur_refresh_token");
                      localStorage.removeItem("aur_logged_in");
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
