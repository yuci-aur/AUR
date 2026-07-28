"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import Navbar from "./components/navbar/Navbar";
import MobileMenu from "./components/mobile/MobileMenu";
import Homepage from "./components/Homepage";
import RankingsEngine from "./components/RankingsEngine";
import InstitutionDirectory from "./components/InstitutionDirectory";
import ComparisonDock from "./components/ComparisonDock";
import ComparisonMatrix from "./components/ComparisonMatrix";
import UniversityProfile from "./components/UniversityProfile";
import Footer from "./components/Footer";
import FloatingChatAssistant from "./components/FloatingChatAssistant";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import Login from "./components/Login";
import UserDashboard from "./components/UserDashboard";
import UniversitiesList from "./components/UniversitiesList";
// import Methodology from "./components/Methodology";
import Methodology from "./components/Methodology";
import EventsAndAwards from "./components/EventsAndAwards";
import NewsFeed from "./components/NewsFeed";
import BlogFeed from "./components/BlogFeed";
import BlogForm from "./components/blog/BlogForm";
import { useSidebar } from "./components/navigation/SidebarContext";
import { useUniversityData } from "./components/data/UniversityDataProvider";
import type { Article } from "./types";
import { Bookmark, ShieldAlert } from "lucide-react";
import { signOut } from "firebase/auth";
import DiscoveryJoinModal from "./components/DiscoveryJoinModal";
import ProfileSection from "./components/ProfileSection";
import { isProtectedView } from "./components/navigation/config";
import { useAuthGate } from "./components/auth/AuthGate";
import { authenticatedFetch } from "./lib/authenticated-fetch";
import { firebaseAuth } from "./lib/firebase";

export default function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { universities } = useUniversityData();
  const { requireAuth, isAuthenticated, authReady } = useAuthGate();

  const {
    activeView,
    handleViewChange,
    selectedUniId,
    setSelectedUniId,
    selectedUniIds,
    handleToggleCompare,
    handleRemoveCompare,
    handleClearCompare,
    searchQuery,
    setSearchQuery,
  } = useSidebar();


const [savedUniIds, setSavedUniIds] = useState<string[]>([]);

// Load real bookmarks on mount (only if logged in)
useEffect(() => {
  const user = firebaseAuth.currentUser;
  if (!user) {
    setSavedUniIds([]);
    return;
  }
  authenticatedFetch("/api/account/bookmarks")
    .then((response) => response.json() as Promise<string[]>)
    .then(setSavedUniIds)
    .catch((err) => console.error("Failed to load bookmarks", err));
}, [isAuthenticated]);
  // Derived state from URL (synced with context)
  const requestedView =
    activeView === "institution-register"
      ? isAuthenticated
        ? "profile"
        : "login"
      : activeView;
  const view = !isAuthenticated && isProtectedView(requestedView)
    ? "login"
    : requestedView;
  const id = selectedUniId;

  // A key to force AnimatePresence re-mount on view change
  const viewKey = view + (id ?? "");

  const handleToggleSave = async (uniId: string) => {
  const user = firebaseAuth.currentUser;
  if (!user) {
    requireAuth(undefined, "Sign in to save universities to your shortlist.");
    return;
  }

  const isCurrentlySaved = savedUniIds.includes(uniId);
  try {
    if (isCurrentlySaved) {
      await authenticatedFetch(
        `/api/account/bookmarks?universityId=${encodeURIComponent(uniId)}`,
        { method: "DELETE" },
      );
      setSavedUniIds((prev) => prev.filter((id) => id !== uniId));
    } else {
      await authenticatedFetch("/api/account/bookmarks", {
        method: "POST",
        body: JSON.stringify({ universityId: uniId }),
      });
      setSavedUniIds((prev) => [...prev, uniId]);
    }
  } catch (err) {
    console.error("Failed to toggle bookmark", err);
  }
};

  const handleUniversitySelect = (uniId: string) => {
    requireAuth(() => {
      setSelectedUniId(uniId);
    }, "Sign in to view full university profiles, metrics, and admissions details.");
  };

  const handleGatedToggleCompare = (uniId: string) => {
    requireAuth(
      () => handleToggleCompare(uniId),
      "Sign in to compare universities side by side."
    );
  };

  const handleBackToRankings = () => {
    setSelectedUniId(null);
  };

  const handleArticleSelect = (article: Article) => {
    router.push(`/blogs/${article.id}`);
  };

  // Get selected universities for Saved view
  const savedUniversities = universities.filter((u) => savedUniIds.includes(u.id));

  useEffect(() => {
    if (authReady && !isAuthenticated && isProtectedView(activeView)) {
      router.replace("?view=login&mode=login");
    }
  }, [activeView, authReady, isAuthenticated, router]);

  const openAuth = (mode: "login" | "signup") => {
    router.push(`?view=login&mode=${mode}`);
  };

  const handleSignOut = async () => {
    await signOut(firebaseAuth);
    localStorage.removeItem("aur_logged_in");
    window.dispatchEvent(new Event("aur-auth-change"));
    router.push("?view=login&mode=login");
  };


  return (
    <div className={`${view === "home" ? "bg-gradient-to-b from-amber-50/50 via-white to-blue-50 dark:bg-none dark:bg-cyber-black" : "aur-page"} flex min-h-screen flex-col transition-colors duration-300`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[110] focus:rounded-lg focus:bg-aur-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to main content
      </a>
      {/* Top Navigation Bar */}
      {view !== "login" && (
        <Navbar
          isAuthenticated={isAuthenticated}
          onLogIn={() => openAuth("login")}
          onSignUp={() => openAuth("signup")}
          onSignOut={handleSignOut}
        />
      )}

      {/* Main Core Layout */}
      <div className="flex w-full grow">
        {/* Main Content Area — Full Width */}
        <main
          id="main-content"
          className={`flex-1 flex flex-col min-w-0 pb-20 md:pb-0 ${
            view === "home" || view === "login" ? "p-0" : "px-4 pt-4 lg:px-8 lg:pt-8"
          }`}
          style={{ isolation: "isolate" }}
        >
          <>
            <div
              key={viewKey}
              
              
              
              
              className="flex flex-col flex-grow"
            >
          {view === "home" && (
            <Homepage
              onSearchSubmit={(q) => setSearchQuery(q)}
              onUniversitySelect={handleUniversitySelect}
              onArticleSelect={handleArticleSelect}
              onViewChange={handleViewChange}
              isAuthenticated={isAuthenticated}
            />
          )}

          {(view === "rankings" || view === "countries") && (
            <RankingsEngine
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              selectedUniIds={selectedUniIds}
              onToggleCompare={handleGatedToggleCompare}
              onUniversitySelect={handleUniversitySelect}
            />
          )}

          {view === "universities" && (
            <InstitutionDirectory
              onUniversitySelect={handleUniversitySelect}
            />
          )}


          {activeView === "university-profile" && selectedUniId && (
            <UniversityProfile 
              universityId={selectedUniId} 
              onBack={handleBackToRankings}
              onViewChange={handleViewChange}
              savedUniIds={savedUniIds}
              onToggleSave={handleToggleSave}
            />
          )}

          {/* Analytics Dashboard */}
          {view === "analytics" && <AnalyticsDashboard />}

          {/* News (in-app feed) */}
          {view === "news" && <NewsFeed />}

          {/* Blog (in-app feed) */}
          {view === "blog" && <BlogFeed />}

          {/* Methodology */}
          {/* {view === "methodology" && <Methodology />} */}

          {/* Events & Awards */}
          {view === "events" && <EventsAndAwards />}

          {/* Faculty & Student Awards */}
          {view === "faculty-awards" && <EventsAndAwards />}

          {/* Login View */}
          {view === "login" && (
            <Login initialMode={searchParams.get("mode") === "signup" ? "signup" : "login"} />
          )}

          {view === "profile" && <ProfileSection />}

          {/* User Dashboard (Combines Saved & Settings) */}
          {view === "settings" && (
            <UserDashboard
              savedUniversities={savedUniversities}
              onUniversitySelect={handleUniversitySelect}
              onNavigateToRankings={() => handleViewChange("rankings")}
              onSignOut={handleSignOut}
            />
          )}

          {/* 2. Comparison Matrix */}
          {view === "saved" && <ComparisonMatrix />}

            </div>
          </>
        </main>
      </div>

      {/* Mobile Responsive Navigation Drawer & Bottom Bar */}
      {view !== "login" && view !== "admin" && (
        <MobileMenu
          isAuthenticated={isAuthenticated}
          onLogIn={() => openAuth("login")}
          onSignUp={() => openAuth("signup")}
        />
      )}

      {view !== "login" && (
        <ComparisonDock
          selectedIds={selectedUniIds}
          onRemove={handleRemoveCompare}
          onClearAll={handleClearCompare}
          onUniversitySelect={handleUniversitySelect}
        />
      )}

      {view !== "login" && <FloatingChatAssistant />}

      {authReady && !isAuthenticated && view === "home" && (
        <DiscoveryJoinModal
          onLogIn={() => openAuth("login")}
          onSignUp={() => openAuth("signup")}
        />
      )}


    </div>
  );
}
