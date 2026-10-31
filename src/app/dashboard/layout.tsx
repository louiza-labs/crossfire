import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Crossfire",
  description: "Credit Exposure Monitor. System-wide risk analysis across BDC funds. Track systemic borrowers, fund correlations, and stress test default scenarios.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
