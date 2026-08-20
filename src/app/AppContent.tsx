"use client";

import React, { useState, useEffect } from "react";
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
import Login from "./components/Login";
import UserDashboard from "./components/UserDashboard";
// import Methodology from "./components/Methodology";
import EventsAndAwards from "./components/EventsAndAwards";
import RegisteredInstitutions from "./components/RegisteredInstitutions";
import NewsFeed from "./components/NewsFeed";
import BlogFeed from "./components/BlogFeed";
import { useSidebar } from "./components/navigation/SidebarContext";
import { useUniversityData } from "./components/data/UniversityDataProvider";
import type { Article } from "./types";
import { signOut } from "firebase/auth";
import DiscoveryJoinModal from "./components/DiscoveryJoinModal";
import ProfileSection from "./components/ProfileSection";
import { isProtectedView } from "./components/navigation/config";
import { useAuthGate } from "./components/auth/AuthGate";
import { useToast } from "./components/feedback/ToastContext";
import { authenticatedFetch } from "./lib/authenticated-fetch";
import { firebaseAuth } from "./lib/firebase";

export default function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { universities } = useUniversityData();
  const { requireAuth, isAuthenticated, authReady } = useAuthGate();
  const { showToast } = useToast();

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

  // Load the signed-in user's bookmarks. Waits for `authReady` because
  // `firebaseAuth.currentUser` is still null while the SDK restores the
  // session, and clears the list on sign-out so the next user never inherits
  // the previous one's shortlist.
  useEffect(() => {
    if (!authReady) return;

    if (!isAuthenticated) {
      setSavedUniIds([]);
      return;
    }

    let active = true;
    authenticatedFetch("/api/account/bookmarks")
      .then((response) => response.json() as Promise<string[]>)
      .then((ids) => {
        if (active) setSavedUniIds(ids);
      })
      .catch((err) => console.error("Failed to load bookmarks", err));

    return () => {
      active = false;
    };
  }, [authReady, isAuthenticated]);
  // Derived state from URL (synced with context)
  const requestedView =
    activeView === "institution-register"
      ? isAuthenticated
        ? "profile"
        : "login"
      : // The Analytics dashboard was removed; existing links and bookmarks
        // still carry ?view=analytics and would otherwise render an empty page.
        activeView === "analytics"
        ? "home"
        : activeView;
  const view = !isAuthenticated && isProtectedView(requestedView)
    ? "login"
    : requestedView;
  const id = selectedUniId;

  // A key to force AnimatePresence re-mount on view change
  const viewKey = view + (id ?? "");

  const handleToggleSave = async (uniId: string) => {
    if (!isAuthenticated) {
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
      showToast(
        isCurrentlySaved
          ? "Could not remove this university from your shortlist. Please try again."
          : "Could not save this university to your shortlist. Please try again.",
        "warning",
      );
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
          className={`flex-1 flex flex-col min-w-0 ${
            view === "home" || view === "login" ? "p-0" : "px-4 pt-4 lg:px-8 lg:pt-8"
          }`}
          style={{ isolation: "isolate" }}
        >
          <>
            <div key={viewKey} className="flex flex-col flex-grow">
          {view === "home" && (
            <Homepage
              onSearchSubmit={(q) => setSearchQuery(q)}
              onUniversitySelect={handleUniversitySelect}
              onArticleSelect={handleArticleSelect}
              onViewChange={handleViewChange}
              isAuthenticated={isAuthenticated}
            />
          )}

          {/* "countries" is a legacy alias kept so older links still resolve. */}
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

          {/* News (in-app feed) */}
          {view === "news" && <NewsFeed />}

          {/* Blog (in-app feed) */}
          {view === "blog" && <BlogFeed />}

          {/* Methodology — disabled. Re-enable this line and the nav entries in
              navigation/config.ts + Footer.tsx together, or the links dead-end. */}
          {/* {view === "methodology" && <Methodology />} */}

          {/* Events & Awards. "faculty-awards" is kept as an alias so older
              bookmarked links still resolve to the same showcase. */}
          {(view === "events" || view === "faculty-awards") && <EventsAndAwards />}

          {/* Self-registered institutions that passed admin verification.
              Kept separate from the ranked directory: these carry no score. */}
          {view === "institutions" && <RegisteredInstitutions />}

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
              onNavigateToProfile={() => handleViewChange("profile")}
              onSignOut={handleSignOut}
            />
          )}

          {/* 2. Comparison Matrix */}
          {view === "saved" && <ComparisonMatrix />}

            </div>
          </>
        </main>
      </div>

      {/* Mobile Responsive Navigation Drawer */}
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
