"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  getSystemHealthMetrics,
  getSystemicBorrowers,
  getFundOverlap,
  getStressTestImpact,
  funds,
  SystemicBorrower,
  FundOverlapPair,
} from "@/data";
import { AlertTriangle, TrendingDown, Users, Building2, ArrowRight, Zap } from "lucide-react";

// Format currency values - data is already in millions
function formatCurrency(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded >= 1000) return `$${(rounded / 1000).toFixed(1)}B`;
  if (rounded >= 1) return `$${rounded.toFixed(0)}M`;
  if (rounded >= 0.001) return `$${(rounded * 1000).toFixed(0)}K`;
  return `$${rounded.toFixed(0)}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export default function DashboardPage() {
  const [selectedBorrower, setSelectedBorrower] = useState<SystemicBorrower | null>(null);
  const [haircut, setHaircut] = useState(50);

  const metrics = useMemo(() => getSystemHealthMetrics(), []);
  const systemicBorrowers = useMemo(() => getSystemicBorrowers().slice(0, 20), []);
  const fundOverlaps = useMemo(() => getFundOverlap().slice(0, 10), []);

  const stressResult = useMemo(() => {
    if (!selectedBorrower) return null;
    return getStressTestImpact(selectedBorrower.borrower.id, haircut);
  }, [selectedBorrower, haircut]);

  return (
    <div className="min-h-screen bg-black pt-16 pb-12">
      <div className="max-w-[1600px] mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Credit Exposure Monitor</h1>
          <p className="text-sm text-zinc-500 mt-1">
            System-wide risk analysis across {funds.length} BDC funds
          </p>
        </div>

        {/* System Health Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard
            label="Total System AUM"
            value={formatCurrency(metrics.totalSystemAUM)}
            icon={<Building2 className="w-4 h-4" />}
          />
          <MetricCard
            label="Critical Borrowers"
            value={metrics.criticalBorrowers.toString()}
            subtext="4+ funds exposed"
            variant="danger"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <MetricCard
            label="Elevated Risk"
            value={metrics.elevatedBorrowers.toString()}
            subtext="2-3 funds exposed"
            variant="warning"
            icon={<TrendingDown className="w-4 h-4" />}
          />
          <MetricCard
            label="Top 10 Concentration"
            value={formatPercent(metrics.top10BorrowersPct)}
            subtext="of total exposure"
          />
          <MetricCard
            label="Avg Fund Overlap"
            value={formatPercent(metrics.avgFundOverlap)}
            subtext="shared borrowers"
            icon={<Users className="w-4 h-4" />}
          />
          <MetricCard
            label="Max Fund Overlap"
            value={formatPercent(metrics.maxFundOverlap)}
            subtext="highest correlation"
            variant={metrics.maxFundOverlap > 30 ? "warning" : "default"}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Systemic Borrowers Watchlist */}
          <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-white">Systemic Borrowers Watchlist</h2>
                <p className="text-xs text-zinc-500">Ranked by systemic importance score</p>
              </div>
              <Link
                href="/borrowers"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                      Borrower
                    </th>
                    <th className="px-4 py-2 text-right text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                      Funds
                    </th>
                    <th className="px-4 py-2 text-right text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                      Total Exposure
                    </th>
                    <th className="px-4 py-2 text-right text-[10px] font-medium text-zinc-500 uppercase tracking-wider" title="Systemic importance: (funds²) × exposure">
                      Risk Score
                    </th>
                    <th className="px-4 py-2 text-center text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                      Stress Test
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {systemicBorrowers.map((sb, idx) => (
                    <tr
                      key={sb.borrower.id}
                      className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                        selectedBorrower?.borrower.id === sb.borrower.id ? "bg-cyan-500/10" : ""
                      }`}
                    >
                      <td className="px-4 py-2 text-sm tabular-nums text-zinc-500">{idx + 1}</td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/borrowers/${sb.borrower.id}`}
                          className="text-sm text-zinc-200 hover:text-cyan-400 transition-colors"
                        >
                          {sb.borrower.name}
                        </Link>
                        <div className="text-[10px] text-zinc-600">{sb.borrower.industry}</div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium ${
                            sb.fundCount >= 4
                              ? "bg-red-500/20 text-red-400"
                              : sb.fundCount >= 2
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          {sb.fundCount}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-sm tabular-nums text-zinc-300">
                        {formatCurrency(sb.totalExposure)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm tabular-nums text-zinc-400">
                        {sb.systemicScore >= 100
                          ? sb.systemicScore.toFixed(0)
                          : sb.systemicScore >= 10
                            ? sb.systemicScore.toFixed(1)
                            : sb.systemicScore.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() =>
                            setSelectedBorrower(
                              selectedBorrower?.borrower.id === sb.borrower.id ? null : sb
                            )
                          }
                          className={`p-1.5 rounded transition-colors ${
                            selectedBorrower?.borrower.id === sb.borrower.id
                              ? "bg-cyan-500 text-black"
                              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                          }`}
                          title="Run stress test"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Stress Test Panel */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-medium text-white">Stress Test Simulator</h3>
              </div>

              {selectedBorrower ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Selected Borrower</div>
                    <div className="text-sm font-medium text-white">{selectedBorrower.borrower.name}</div>
                    <div className="text-xs text-zinc-500">
                      {selectedBorrower.fundCount} funds · {formatCurrency(selectedBorrower.totalExposure)}{" "}
                      exposure
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-zinc-500">Haircut Scenario</span>
                      <span className="text-sm font-medium text-amber-400">{haircut}% Loss</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={haircut}
                      onChange={(e) => setHaircut(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-600 mt-1">
                      <span>10% discount</span>
                      <span>Total default</span>
                    </div>
                  </div>

                  {stressResult && (
                    <div className="pt-4 border-t border-zinc-800 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                          <div className="text-[10px] text-red-400 uppercase">Total Loss</div>
                          <div className="text-lg font-semibold text-red-400 tabular-nums">
                            {formatCurrency(stressResult.totalLoss)}
                          </div>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2">
                          <div className="text-[10px] text-amber-400 uppercase">Max Impact</div>
                          <div className="text-lg font-semibold text-amber-400 tabular-nums">
                            {formatPercent(stressResult.systemWideImpact.maxPctImpact)}
                          </div>
                          <div className="text-[9px] text-amber-400/70">of fund AUM</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                          Impact by Fund
                        </div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {stressResult.fundImpacts.map((impact) => (
                            <div
                              key={impact.fund.id}
                              className="flex items-center justify-between text-xs"
                            >
                              <Link
                                href={`/funds/${impact.fund.id}`}
                                className="ticker-badge text-[10px] hover:bg-cyan-500/25"
                              >
                                {impact.fund.ticker}
                              </Link>
                              <div className="flex items-center gap-3">
                                <span className="text-zinc-500 tabular-nums">
                                  -{formatCurrency(impact.loss)}
                                </span>
                                <span
                                  className={`tabular-nums font-medium ${
                                    impact.pctOfAUM >= 5
                                      ? "text-red-400"
                                      : impact.pctOfAUM >= 2
                                        ? "text-amber-400"
                                        : "text-zinc-400"
                                  }`}
                                >
                                  {formatPercent(impact.pctOfAUM)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-600">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Select a borrower from the watchlist to simulate default scenarios</p>
                </div>
              )}
            </div>

            {/* Fund Overlap Rankings */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800">
                <h3 className="text-sm font-medium text-white">Most Correlated Fund Pairs</h3>
                <p className="text-xs text-zinc-500">By shared borrower exposure</p>
              </div>
              <div className="p-4 space-y-3">
                {fundOverlaps.map((pair, idx) => (
                  <div key={`${pair.fund1.id}-${pair.fund2.id}`} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-600 tabular-nums w-4">{idx + 1}</span>
                        <Link
                          href={`/funds/${pair.fund1.id}`}
                          className="ticker-badge text-[10px] hover:bg-cyan-500/25"
                        >
                          {pair.fund1.ticker}
                        </Link>
                        <span className="text-zinc-600">×</span>
                        <Link
                          href={`/funds/${pair.fund2.id}`}
                          className="ticker-badge text-[10px] hover:bg-cyan-500/25"
                        >
                          {pair.fund2.ticker}
                        </Link>
                      </div>
                      <span className="text-xs text-zinc-500 tabular-nums">
                        {pair.sharedBorrowerCount} shared
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500/70 rounded-full"
                            style={{ width: `${Math.min(pair.overlapPct1, 100)}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-zinc-600 mt-0.5">
                          {formatPercent(pair.overlapPct1)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500/70 rounded-full"
                            style={{ width: `${Math.min(pair.overlapPct2, 100)}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-zinc-600 mt-0.5">
                          {formatPercent(pair.overlapPct2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  variant = "default",
  icon,
}: {
  label: string;
  value: string;
  subtext?: string;
  variant?: "default" | "danger" | "warning";
  icon?: React.ReactNode;
}) {
  const valueColor = {
    default: "text-white",
    danger: "text-red-400",
    warning: "text-amber-400",
  }[variant];

  const borderColor = {
    default: "border-zinc-800",
    danger: "border-red-500/30",
    warning: "border-amber-500/30",
  }[variant];

  const bgColor = {
    default: "bg-zinc-900/50",
    danger: "bg-red-500/5",
    warning: "bg-amber-500/5",
  }[variant];

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg px-4 py-3`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className={valueColor}>{icon}</span>}
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-semibold tabular-nums ${valueColor}`}>{value}</div>
      {subtext && <div className="text-[9px] text-zinc-600 mt-0.5">{subtext}</div>}
    </div>
  );
}
