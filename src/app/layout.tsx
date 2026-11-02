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
  title: {
    default: "Crossfire — Private Credit Intelligence",
    template: "%s | Crossfire",
  },
  description:
    "Exposing systemic risk in private credit. Map shared borrowers across BDC funds, analyze interconnections, and stress test default scenarios.",
  metadataBase: new URL("https://crossfire.finance"),

  // SEO
  keywords: [
    "private credit",
    "BDC",
    "business development company",
    "systemic risk",
    "credit analysis",
    "fund overlap",
    "shared borrowers",
    "credit intelligence",
    "portfolio risk",
    "stress testing",
    "private debt",
    "direct lending",
  ],
  authors: [{ name: "Crossfire" }],
  creator: "Crossfire",
  publisher: "Crossfire",

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },

  // Manifest
  manifest: "/manifest.webmanifest",

  // Category
  category: "finance",

  // Open Graph
  openGraph: {
    title: "Crossfire — Private Credit Intelligence",
    description:
      "Exposing systemic risk in private credit. Map shared borrowers across BDC funds, analyze interconnections, and stress test default scenarios.",
    siteName: "Crossfire",
    locale: "en_US",
    type: "website",
    url: "https://crossfire.finance",
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Crossfire — Private Credit Intelligence",
    description:
      "Exposing systemic risk in private credit. Map shared borrowers, analyze fund interconnections, stress test defaults.",
    creator: "@crossaborea",
    site: "@crossaborea",
  },

  // Verification (add your actual verification codes when ready)
  // verification: {
  //   google: "your-google-verification-code",
  // },

  // Alternate languages (if applicable)
  alternates: {
    canonical: "https://crossfire.finance",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body
        className="min-h-full bg-[#050506] text-white/95"
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
