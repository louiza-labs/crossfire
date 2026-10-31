import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { PostHogProvider } from "@/components/PostHogProvider";
import { PostHogPageView } from "@/components/PostHogPageView";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crossfire — Private Credit Intelligence",
  description: "Exposing systemic risk in private credit. Map shared borrowers across BDC funds, analyze interconnections, and stress test default scenarios.",
  metadataBase: new URL("https://crossfire.finance"),
  openGraph: {
    title: "Crossfire — Private Credit Intelligence",
    description: "Exposing systemic risk in private credit. Map shared borrowers across BDC funds, analyze interconnections, and stress test default scenarios.",
    siteName: "Crossfire",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crossfire — Private Credit Intelligence",
    description: "Exposing systemic risk in private credit. Map shared borrowers, analyze fund interconnections, stress test defaults.",
  },
};

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-black/95 backdrop-blur-sm border-b border-zinc-800/50">
      <div className="h-full max-w-[1800px] mx-auto px-6 flex items-center justify-between">
        {/* Logo/Brand */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Crossfire</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/">Network</NavLink>
          <NavLink href="/funds">Funds</NavLink>
          <NavLink href="/borrowers">Borrowers</NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded transition-colors"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-black text-zinc-100" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        <PostHogProvider>
          <PostHogPageView />
          <Header />
          <main className="pt-12">{children}</main>
        </PostHogProvider>
      </body>
    </html>
  );
}
