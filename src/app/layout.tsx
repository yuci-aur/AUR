import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import SmoothScrolling from "./components/SmoothScrolling";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",   // prevents invisible text during font load
  preload: true,
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Asia University Rankings | Premium Institutional Portal",
  description:
    "Comprehensive editorial rankings and comparisons of top universities across Asia, built for international scholars and medical students.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,   // allow pinch-zoom on mobile (accessibility)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfb" },
    { media: "(prefers-color-scheme: dark)",  color: "#060609" },
  ],
};

const stripExtensionHydrationAttrs = `
(() => {
  const attr = "fdprocessedid";
  const strip = (root = document) => {
    root.querySelectorAll?.("[" + attr + "]").forEach((node) => {
      node.removeAttribute(attr);
    });
  };

  strip();

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        mutation.target.removeAttribute(attr);
      }
    }
  }).observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: [attr],
  });
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${spaceGrotesk.variable} antialiased`}
      style={{ overscrollBehaviorY: "none" }}
    >
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesque@800,500,700,400,300,900&display=swap" rel="stylesheet" />
      </head>
      <body className="flex flex-col font-sans bg-[var(--background)] text-[var(--foreground)] w-full max-w-[100vw] overflow-x-hidden" style={{ overscrollBehavior: "none" }}>
        {process.env.NODE_ENV === "development" && (
          <Script
            id="strip-extension-hydration-attrs"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: stripExtensionHydrationAttrs }}
          />
        )}
        <SmoothScrolling>
          {children}
        </SmoothScrolling>
      </body>
    </html>
  );
}
