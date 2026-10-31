import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { funds, getHoldingsByFund } from "@/data";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const fund = funds.find((f) => f.id === id);
  if (!fund) return { title: "Fund Not Found — Crossfire" };

  const holdings = getHoldingsByFund(fund.id);

  return {
    title: `${fund.ticker} — ${fund.name} — Crossfire`,
    description: `${fund.ticker} (${fund.name}) holds ${holdings.length} positions. Managed by ${fund.managerName}. View holdings, industry breakdown, and interconnection analysis.`,
  };
}

// Generate static params for all funds
export function generateStaticParams() {
  return funds.map((fund) => ({
    id: fund.id,
  }));
}

// Format currency values
function formatCurrency(value: number): string {
  // Round to avoid floating point issues
  const rounded = Math.round(value * 100) / 100;
  if (rounded >= 1000) return `$${(rounded / 1000).toFixed(1)}B`;
  if (rounded >= 1) return `$${rounded.toFixed(1)}M`;
  return `$${(rounded * 1000).toFixed(0)}K`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

// Truncate long industry descriptions
function truncateIndustry(industry: string, maxLength = 50): string {
  if (!industry || industry === "Unknown" || industry === "Unclassified") {
    return "—";
  }
  if (industry.length <= maxLength) return industry;
  return industry.slice(0, maxLength - 1) + "…";
}

export default async function FundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fund = funds.find(f => f.id === id);

  if (!fund) {
    notFound();
  }

  const holdings = getHoldingsByFund(fund.id);

  const totalPrincipal = holdings.reduce((sum, h) => sum + h.principal, 0);
  const totalFairValue = holdings.reduce((sum, h) => sum + h.fairValue, 0);
  const avgRate = holdings.length > 0
    ? holdings.reduce((sum, h) => sum + h.rate, 0) / holdings.length
    : 0;

  // Group by industry, excluding Unknown/Unclassified for breakdown
  const industryBreakdown = holdings.reduce((acc, h) => {
    const industry = h.industry && h.industry !== "Unknown" && h.industry !== "Unclassified"
      ? h.industry
      : null;
    if (industry) {
      acc[industry] = (acc[industry] || 0) + h.principal;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/funds" className="text-xs text-zinc-500 hover:text-white mb-2 inline-block transition-colors">
          ← Back to Funds
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{fund.name}</h1>
          <span className="ticker-badge text-sm">{fund.ticker}</span>
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          Managed by <span className="text-zinc-300">{fund.managerName}</span> · {fund.type}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Total Assets" value={formatCurrency(fund.totalAssets)} />
        <StatCard label="Holdings" value={holdings.length.toString()} />
        <StatCard label="Avg Rate" value={formatPercent(avgRate)} />
        <StatCard label="Fair Value" value={formatCurrency(totalFairValue)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Holdings Table */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <h2 className="text-sm font-medium text-white">Holdings</h2>
              <p className="text-xs text-zinc-500">Portfolio companies and loan details</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Borrower</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Industry</th>
                    <th className="px-4 py-2 text-right text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Principal</th>
                    <th className="px-4 py-2 text-right text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Rate</th>
                    <th className="px-4 py-2 text-right text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Maturity</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map(holding => (
                    <tr key={holding.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-2">
                        <Link
                          href={`/borrowers/${holding.borrowerId}`}
                          className="text-sm text-zinc-200 hover:text-cyan-400 transition-colors"
                        >
                          {holding.borrower.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-500 max-w-[200px]">
                        {truncateIndustry(holding.industry)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm tabular-nums text-zinc-300">
                        {formatCurrency(holding.principal)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm tabular-nums text-zinc-400">
                        {holding.rate > 0 ? formatPercent(holding.rate) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-zinc-500">
                        {holding.maturity || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Industry Breakdown */}
          {Object.keys(industryBreakdown).length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Industry Breakdown</h3>
              <div className="space-y-2.5">
                {Object.entries(industryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([industry, amount]) => (
                    <div key={industry}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400 truncate max-w-[180px]" title={industry}>
                          {truncateIndustry(industry, 35)}
                        </span>
                        <span className="text-zinc-500 tabular-nums">
                          {((amount / totalPrincipal) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500/70 rounded-full"
                          style={{ width: `${Math.min((amount / totalPrincipal) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SEC Filing Link */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">SEC Filing</h3>
            <a
              href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${fund.cik}&type=10-K`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View 10-K filings on SEC EDGAR →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className="text-xl font-semibold text-white tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
