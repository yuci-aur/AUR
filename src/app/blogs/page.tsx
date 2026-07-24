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
            <section className="mx-auto w-full max-w-6xl py-4 sm:py-8">
              <Link href="/" className="group mb-6 inline-flex items-center text-xs font-bold uppercase tracking-wider text-slate-600 transition-colors hover:text-[#1A365D]">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                Back to Home
              </Link>
              <div className="mb-8 border-b border-[var(--aur-border)] pb-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Blog</span>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Blog</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">Research, rankings, and practical perspectives on the forces shaping Asian higher education.</p>
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
