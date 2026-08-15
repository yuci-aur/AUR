"use client";

import React from "react";
import { useSidebar } from "../navigation/SidebarContext";
import { SIDEBAR_ITEMS, NavItem, isProtectedView } from "../navigation/config";
import { Button } from "@/components/ui/button";

import { X, LogIn } from "lucide-react";

interface MobileMenuProps {
  isAuthenticated?: boolean;
  onLogIn?: () => void;
}

export default function MobileMenu({
  isAuthenticated = true,
  onLogIn,
}: MobileMenuProps) {
  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-cyber-yellow dark:focus-visible:ring-offset-cyber-black";
  const {
    activeView,
    handleViewChange,
    isMobileOpen,
    setIsMobileOpen,
  } = useSidebar();

  const handleLinkClick = (item: NavItem) => {
    handleViewChange(item.view);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* 1. Mobile Left Drawer (Sidebar Navigation) */}
      <>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex font-sans">

            {/* Backdrop Blur Overlay */}
            <div



              onClick={() => setIsMobileOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Slide-in Drawer Content */}
            <div




              className="relative w-80 max-w-[85vw] h-full flex flex-col shadow-2xl z-10 bg-[var(--aur-surface)] text-[var(--aur-text)] border-r border-[var(--aur-border)]"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-200 dark:border-cyber-border/40 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    ASIA UNIVERSITY <span className="text-amber-700 dark:text-cyber-yellow text-[10px] font-sans font-bold">PORTAL</span>
                  </h3>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Mobile Academic Lab
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Close menu"
                  className={`h-auto w-auto rounded-md border-0 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-cyber-yellow transition-colors hover:bg-slate-100 dark:hover:bg-cyber-gray ${focusRing}`}
                >
                  <X className="size-5" />
                </Button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <nav className="space-y-1">
                  {SIDEBAR_ITEMS.filter((item) => isAuthenticated || !isProtectedView(item.view)).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.view;
                    return (
                      <Button
                        type="button"
                        variant="ghost"
                        key={item.id}
                        onClick={() => handleLinkClick(item)}
                        className={`w-full h-auto justify-start gap-0 flex items-center p-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                          isActive
                            ? "bg-slate-150 hover:bg-slate-150 border border-slate-200 text-slate-900 hover:text-slate-900 dark:bg-cyber-yellow dark:hover:bg-cyber-yellow dark:text-cyber-black dark:hover:text-cyber-black dark:border-transparent dark:shadow-[0_0_10px_rgba(234,179,8,0.15)]"
                            : "border-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-cyber-gray/30"
                        } ${focusRing}`}
                      >
                        <Icon className="size-4.5 mr-3.5 shrink-0" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase bg-amber-100 text-amber-900 dark:bg-cyber-black dark:text-cyber-yellow border dark:border-cyber-yellow/20">
                            {item.badge}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-slate-200 dark:border-cyber-border/40 bg-slate-50 dark:bg-cyber-dark/50">
                {!isAuthenticated && (
                  <div className="border-b border-slate-200 p-3 dark:border-cyber-border/40">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsMobileOpen(false);
                        onLogIn?.();
                      }}
                      className={`flex h-auto w-full items-center justify-center gap-2 rounded-lg border border-slate-200 p-3 text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-cyber-border/40 dark:text-slate-300 dark:hover:bg-cyber-gray/30 dark:hover:text-white ${focusRing}`}
                    >
                      <LogIn className="size-4 shrink-0" />
                      <span>Log In</span>
                    </Button>
                  </div>
                )}
                <div className="p-4 text-center font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  System Version: 2026.01
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    </>
  );
}
