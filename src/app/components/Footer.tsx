/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSidebar } from "./navigation/SidebarContext";
import { subscribeToNewsletter } from "../lib/firebase-content";

import {
  ArrowRight,
} from "lucide-react";

const exploreLinks = [
  { label: "Universities", view: "universities" },
  { label: "Countries", view: "countries" },
  { label: "Scholarships", missing: true },
  { label: "Rankings", view: "rankings" },
  { label: "Compare Universities", view: "saved" },
  { label: "Trending Universities", missing: true },
];

const resourcesLinks = [
  { label: "Admission Guide", missing: true },
  { label: "Visa Information", missing: true },
  { label: "Student Life", missing: true },
  { label: "FAQ", missing: true },
  { label: "Blog", missing: true },
  { label: "Contact", missing: true },
];

const socialLinks = [
  { label: "Twitter", imgSrc: "/twitter-logo.png", href: "https://twitter.com" },
  { label: "LinkedIn", imgSrc: "/linkedin-logo.png", href: "https://www.linkedin.com/company/asia-university-rankings/" },
  { label: "Instagram", imgSrc: "/instagram-logo.png", href: "https://www.instagram.com/asiauniversityrankings/" },
  { label: "YouTube", imgSrc: "/youtube-logo.png", href: "https://www.youtube.com/" },
];

export default function Footer() {
  const { handleViewChange } = useSidebar();
  const [email, setEmail] = useState("");
const [status, setStatus] = useState("");
const [loading, setLoading] = useState(false);

const handleSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    setStatus("Please enter a valid email address.");
    return;
  }

  setLoading(true);
  setStatus("");

  try {
    await subscribeToNewsletter(trimmedEmail);

    setStatus("Thank you for subscribing!");
    setEmail("");
  } catch (error) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Unable to connect. Please try again later."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <footer className="mt-12 bg-white text-slate-900">
      <div
        
        
        
        
        className="border-t border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-5">
              <div className="flex items-center mb-4">
                <Image
                  src="/logo.png"
                  alt="Asia University Rankings Logo"
                  width={160}
                  height={136}
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
              <div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  The trusted portal for ranking, comparing, and discovering top institutions across Asia.
                </p>
              </div>
              <nav aria-label="Social media">
                <ul className="flex flex-wrap gap-3">
                  {socialLinks.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={social.label}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600  duration-200 hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        <img
                          src={social.imgSrc}
                          alt={`${social.label} icon`}
                          className="h-5 w-5 object-contain"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-600">
                Explore
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {exploreLinks.map((item) => (
                  <li key={item.label}>
                    {item.view ? (
                      <button
                        type="button"
                        onClick={() => handleViewChange(item.view!)}
                        className="flex w-full items-center justify-start gap-3 transition-colors duration-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        <ArrowRight className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                        {item.label}
                      </button>
                    ) : (
                      <span className="flex w-full items-center justify-start gap-3 text-slate-600 italic">
                        <ArrowRight className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                        {item.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-600">
                Resources
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {resourcesLinks.map((item) => (
                  <li key={item.label}>
                    <span className="inline-flex items-center gap-3 text-slate-600 italic">
                      <ArrowRight className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-600">
                  Newsletter
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Stay updated with the latest ranking insights, scholarship news, and institution highlights.
                </p>
              </div>
              <form onSubmit={handleSubscribe} className="space-y-4">
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-600 outline-none  duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white"
                  aria-label="Email address"
                />
                <button
  type="submit"
  disabled={loading}
  className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950  duration-200 hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(234,179,8,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
>
  {loading ? "..." : "Subscribe"}
</button>
              </form>
              {status ? (
                <p className="text-sm text-slate-500" aria-live="polite">
                  {status}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
