"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileMenuButton, MobileMenu } from "./MobileNav";

// Minimalist geometric logo mark
function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring - thin stroke */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.4" />
      {/* Inner intersecting lines - crossfire pattern */}
      <line
        x1="12"
        y1="4"
        x2="12"
        y2="20"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeOpacity="0.6"
      />
      <line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeOpacity="0.6"
      />
      {/* Diagonal cross */}
      <line
        x1="6.34"
        y1="6.34"
        x2="17.66"
        y2="17.66"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeOpacity="0.3"
      />
      <line
        x1="17.66"
        y1="6.34"
        x2="6.34"
        y2="17.66"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeOpacity="0.3"
      />
      {/* Center point - accent */}
      <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.9" />
      {/* Subtle outer glow dots */}
      <circle cx="12" cy="4" r="1" fill="currentColor" fillOpacity="0.5" />
      <circle cx="12" cy="20" r="1" fill="currentColor" fillOpacity="0.5" />
      <circle cx="4" cy="12" r="1" fill="currentColor" fillOpacity="0.5" />
      <circle cx="20" cy="12" r="1" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 md:h-12 bg-[#050506]/90 backdrop-blur-xl border-b border-white/[0.04] safe-area-pt">
        <div className="h-full max-w-[1800px] mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <LogoMark className="w-6 h-6 md:w-5 md:h-5 text-[#e0f2fe] transition-all duration-300 group-hover:text-white" />
            <div className="flex flex-col">
              <span className="text-sm md:text-xs font-light text-white/90 tracking-wide">
                Crossfire
              </span>
              <span className="hidden md:block text-[8px] font-medium tracking-[0.2em] uppercase text-white/30">
                Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-0.5">
            <NavLink href="/dashboard" active={pathname === "/dashboard"}>
              Dashboard
            </NavLink>
            <NavLink href="/" active={pathname === "/"}>
              Network
            </NavLink>
            <NavLink href="/funds" active={pathname === "/funds" || pathname.startsWith("/funds/")}>
              Funds
            </NavLink>
            <NavLink
              href="/borrowers"
              active={pathname === "/borrowers" || pathname.startsWith("/borrowers/")}
            >
              Borrowers
            </NavLink>
          </nav>

          {/* Mobile Menu Button */}
          <MobileMenuButton onClick={() => setIsMenuOpen(true)} />
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <MobileMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </>
  );
}

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-[11px] font-medium tracking-wide rounded-md transition-all duration-200 ${
        active
          ? "text-white/95 bg-white/[0.06]"
          : "text-white/50 hover:text-white/90 hover:bg-white/[0.04]"
      }`}
    >
      {children}
    </Link>
  );
}
