"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Network, Building2, Users } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/", label: "Network", icon: Network },
  { href: "/funds", label: "Funds", icon: Building2 },
  { href: "/borrowers", label: "Borrowers", icon: Users },
];

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 -mr-2 text-white/50 hover:text-white/90 transition-colors duration-200"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

export function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#050506]/90 backdrop-blur-xl" onClick={onClose} />

      {/* Menu panel */}
      <div className="absolute right-0 top-0 bottom-0 w-72 bg-[#0a0a0c] border-l border-white/[0.06] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
          <span className="text-sm font-light text-white/90 tracking-wide">Menu</span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-white/40 hover:text-white/80 transition-colors duration-200"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-white/[0.06] text-white/95"
                    : "text-white/50 hover:text-white/90 hover:bg-white/[0.03]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#e0f2fe]" : ""}`} />
                <span className="text-sm font-light tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer branding */}
        <div className="absolute bottom-8 left-4 right-4">
          <div className="text-[9px] text-white/20 tracking-[0.2em] uppercase">
            Crossfire Intelligence
          </div>
        </div>
      </div>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-white/[0.04] safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px] transition-all duration-200 ${
                isActive ? "text-white/95" : "text-white/40"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#e0f2fe]" : ""}`} />
              <span
                className={`text-[9px] tracking-wide ${isActive ? "font-medium" : "font-normal"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
