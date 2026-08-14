import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const siteDescription =
  "Minimal animated React components, designed for copy-and-own workflows.";

export const metadata: Metadata = {
  metadataBase: new URL("https://suluu.dev"),
  title: {
    default: "Suluu — Animated React components",
    template: "%s — Suluu",
  },
  description: siteDescription,
  openGraph: {
    title: "Suluu — Animated React components",
    description: siteDescription,
    siteName: "Suluu",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Suluu — Animated React components",
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <a
            className="fixed top-3 left-3 z-50 -translate-y-20 rounded-full bg-[var(--site-foreground)] px-4 py-2 text-sm font-medium text-[var(--site-background)] transition-transform focus:translate-y-0"
            href="#content"
          >
            Skip to content
          </a>
          <SiteHeader />
          {children}
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
