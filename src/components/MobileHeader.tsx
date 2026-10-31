"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { MobileMenuButton, MobileMenu } from "./MobileNav";

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 md:h-12 bg-black/95 backdrop-blur-sm border-b border-zinc-800/50 safe-area-pt">
        <div className="h-full max-w-[1800px] mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-6 md:h-6 rounded bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 md:w-3.5 md:h-3.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <span className="text-base md:text-sm font-semibold text-white tracking-tight">
              Crossfire
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/">Network</NavLink>
            <NavLink href="/funds">Funds</NavLink>
            <NavLink href="/borrowers">Borrowers</NavLink>
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
