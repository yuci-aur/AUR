import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import BlogGrid from "../components/blog/BlogGrid";
import { SidebarProvider } from "../components/navigation/SidebarContext";
import { ToastProvider } from "../components/feedback/ToastContext";
import { UniversityDataProvider } from "../components/data/UniversityDataProvider";

export default function BlogPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-xs font-bold uppercase tracking-widest text-slate-400">Loading blog…</div>}>
      <ToastProvider>
        <SidebarProvider>
          <UniversityDataProvider>
            <AppLayout>
            <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
              <Link href="/" className="group mb-8 inline-flex items-center text-xs font-bold uppercase tracking-wider text-[var(--aur-text-muted)] transition-colors hover:text-[var(--aur-text)]">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                Back to Home
              </Link>
              <div className="mb-12 border-b border-[var(--aur-border)] pb-8">
                <span className="aur-chip bg-[var(--aur-surface-2)] text-[var(--aur-text)] mb-4 inline-flex">Latest Insights</span>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[var(--aur-text)] mb-6">The Editorial Blog</h1>
                <p className="max-w-3xl text-lg leading-relaxed text-[var(--aur-text-secondary)]">Research, rankings, and practical perspectives on the forces shaping Asian higher education. Explore our curated insights and deep dives into the future of academia.</p>
              </div>
              <BlogGrid />
            </section>
            </AppLayout>
          </UniversityDataProvider>
        </SidebarProvider>
      </ToastProvider>
    </Suspense>
  );
}
