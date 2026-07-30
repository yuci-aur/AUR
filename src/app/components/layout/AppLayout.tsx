"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import Navbar from "../navbar/Navbar";
import MobileMenu from "../mobile/MobileMenu";
import FloatingChatAssistant from "../FloatingChatAssistant";
import ComparisonDock from "../ComparisonDock";
import { useSidebar } from "../navigation/SidebarContext";
import { useAuthGate } from "../auth/AuthGate";
import { firebaseAuth } from "../../lib/firebase";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthGate();
  const {
    selectedUniIds,
    handleRemoveCompare,
    handleClearCompare,
    setSelectedUniId,
  } = useSidebar();

  const handleUniversitySelect = (uniId: string) => {
    setSelectedUniId(uniId);
  };

  // Sub-routes such as /blogs render the shared chrome too, so the auth
  // controls have to reflect the real session — without these props Navbar and
  // MobileMenu fall back to `isAuthenticated = true` and show a signed-in
  // avatar to logged-out visitors.
  const openAuth = (mode: "login" | "signup") => {
    router.push(`/?view=login&mode=${mode}`);
  };

  const handleSignOut = async () => {
    await signOut(firebaseAuth);
    router.push("/?view=login&mode=login");
  };

  return (
    <div
      className="flex min-h-screen flex-col transition-colors duration-300"
    >
      {/* Top Navigation Bar */}
      <Navbar
        isAuthenticated={isAuthenticated}
        onLogIn={() => openAuth("login")}
        onSignUp={() => openAuth("signup")}
        onSignOut={handleSignOut}
      />

      {/* Main Core Layout */}
      <div className="flex w-full grow mx-auto max-w-none px-0">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 p-4 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Responsive Navigation Drawer & Bottom Bar */}
      <MobileMenu
        isAuthenticated={isAuthenticated}
        onLogIn={() => openAuth("login")}
        onSignUp={() => openAuth("signup")}
      />

      <FloatingChatAssistant />

      <ComparisonDock
        selectedIds={selectedUniIds}
        onRemove={handleRemoveCompare}
        onClearAll={handleClearCompare}
        onUniversitySelect={handleUniversitySelect}
      />
    </div>
  );
}
