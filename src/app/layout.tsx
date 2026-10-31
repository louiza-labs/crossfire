import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Capital — Private Credit Intelligence",
  description: "Revealing the hidden web of private credit. Map syndicated debt, uncover fund interconnections, and analyze systemic exposure.",
};

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-black/95 backdrop-blur-sm border-b border-zinc-800/50">
      <div className="h-full max-w-[1800px] mx-auto px-6 flex items-center justify-between">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
            <span className="text-[10px] font-bold text-black">C</span>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Capital</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
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
        <Header />
        <main className="pt-12">{children}</main>
      </body>
    </html>
  );
}
