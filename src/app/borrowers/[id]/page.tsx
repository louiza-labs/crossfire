import Link from "next/link";
import { notFound } from "next/navigation";
import { borrowers, getFundsByBorrower } from "@/data";

// Generate static params for all borrowers
export function generateStaticParams() {
  return borrowers.map((borrower) => ({
    id: borrower.id,
  }));
}

// Format currency values
function formatCurrency(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded >= 1000) return `$${(rounded / 1000).toFixed(1)}B`;
  if (rounded >= 1) return `$${rounded.toFixed(1)}M`;
  return `$${(rounded * 1000).toFixed(0)}K`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export default async function BorrowerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const borrower = borrowers.find(b => b.id === id);

  if (!borrower) {
    notFound();
  }

  const fundHoldings = getFundsByBorrower(borrower.id);
  const totalDebt = fundHoldings.reduce((sum, h) => sum + h.principal, 0);
  const avgRate = fundHoldings.length > 0
    ? fundHoldings.reduce((sum, h) => sum + h.rate, 0) / fundHoldings.length
    : 0;

  // Determine risk level based on fund count
  const fundCount = fundHoldings.length;
  const riskLevel = fundCount >= 4 ? "critical" : fundCount >= 2 ? "elevated" : "normal";
  const riskColor = {
    critical: "text-red-400",
    elevated: "text-emerald-400",
    normal: "text-zinc-400",
  }[riskLevel];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/borrowers" className="text-xs text-zinc-500 hover:text-white mb-2 inline-block transition-colors">
          ← Back to Borrowers
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">{borrower.name}</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {borrower.industry && borrower.industry !== "Unknown" && borrower.industry !== "Unclassified"
                ? borrower.industry
                : "Industry not classified"}
            </p>
          </div>
          {fundCount >= 2 && (
            <div className={`px-3 py-1 rounded-lg border ${
              riskLevel === "critical"
                ? "bg-red-500/10 border-red-500/30"
                : "bg-emerald-500/10 border-emerald-500/30"
            }`}>
              <span className={`text-xs font-medium ${riskColor}`}>
                {fundCount} Fund{fundCount > 1 ? "s" : ""} Exposed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard label="Total Debt" value={formatCurrency(totalDebt)} />
        <StatCard label="Creditor Funds" value={fundCount.toString()} />
        <StatCard label="Avg Rate" value={formatPercent(avgRate)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Debt Distribution */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Debt Distribution</h3>
          <p className="text-xs text-zinc-600 mb-4">Exposure by creditor fund</p>
          <div className="space-y-3">
            {fundHoldings
              .sort((a, b) => b.principal - a.principal)
              .map(holding => {
                const pct = totalDebt > 0 ? (holding.principal / totalDebt) * 100 : 0;
                return (
                  <div key={holding.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <Link
                        href={`/funds/${holding.fund.id}`}
                        className="text-zinc-300 hover:text-cyan-400 transition-colors"
                      >
                        {holding.fund.ticker}
                        <span className="text-zinc-600 ml-2 text-xs">{holding.fund.name}</span>
                      </Link>
                      <span className="text-zinc-400 tabular-nums">
                        {formatCurrency(holding.principal)} <span className="text-zinc-600">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500/70 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Loan Terms Table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Loan Terms</h3>
            <p className="text-xs text-zinc-600">Details by creditor</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-4 py-2 text-left text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Fund</th>
                <th className="px-4 py-2 text-right text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Principal</th>
                <th className="px-4 py-2 text-right text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Rate</th>
                <th className="px-4 py-2 text-right text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Maturity</th>
              </tr>
            </thead>
            <tbody>
              {fundHoldings.map(holding => (
                <tr key={holding.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-2">
                    <Link href={`/funds/${holding.fund.id}`} className="ticker-badge hover:bg-cyan-500/25 transition-colors">
                      {holding.fund.ticker}
                    </Link>
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
