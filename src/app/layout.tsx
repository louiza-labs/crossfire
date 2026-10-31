import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { PostHogProvider } from "@/components/PostHogProvider";
import { PostHogPageView } from "@/components/PostHogPageView";
import { BottomNav } from "@/components/MobileNav";
import { MobileHeader } from "@/components/MobileHeader";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Crossfire — Private Credit Intelligence",
  description:
    "Exposing systemic risk in private credit. Map shared borrowers across BDC funds, analyze interconnections, and stress test default scenarios.",
  metadataBase: new URL("https://crossfire.finance"),
  openGraph: {
    title: "Crossfire — Private Credit Intelligence",
    description:
      "Exposing systemic risk in private credit. Map shared borrowers across BDC funds, analyze interconnections, and stress test default scenarios.",
    siteName: "Crossfire",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crossfire — Private Credit Intelligence",
    description:
      "Exposing systemic risk in private credit. Map shared borrowers, analyze fund interconnections, stress test defaults.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body
        className="min-h-full bg-black text-zinc-100"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        <PostHogProvider>
          <PostHogPageView />
          <MobileHeader />
          <main className="pt-14 md:pt-12 pb-mobile-nav">{children}</main>
          <BottomNav />
        </PostHogProvider>
      </body>
    </html>
  );
}
