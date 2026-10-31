"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { GraphNode } from "./NetworkGraph";
import { Fund, Borrower, Holding, holdings, funds, borrowers, getFundsByBorrower, getHoldingsByFund, getStressTestImpact } from "@/data";

interface NodeDetailPanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

// Format currency values
function formatCurrency(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded >= 1e9) return `$${(rounded / 1e9).toFixed(1)}B`;
  if (rounded >= 1e6) return `$${(rounded / 1e6).toFixed(1)}M`;
  if (rounded >= 1e3) return `$${(rounded / 1e3).toFixed(0)}K`;
  return `$${rounded.toFixed(0)}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  const [showStressTest, setShowStressTest] = useState(false);
  const [haircut, setHaircut] = useState(50);

  if (!node) return null;

  const isFund = node.type === "fund";

  // Get related data
  const relatedHoldings = isFund
    ? getHoldingsByFund(node.id)
    : getFundsByBorrower(node.id);

  const totalExposure = relatedHoldings.reduce((sum, h) => sum + h.fairValue, 0);
  const avgRate =
    relatedHoldings.length > 0
      ? relatedHoldings.reduce((sum, h) => sum + h.rate, 0) / relatedHoldings.length
      : 0;

  // For borrowers, get unique funding funds
  const fundingFunds = !isFund
    ? Array.from(new Set(relatedHoldings.map((h) => (h as Holding & { fund: Fund }).fund)))
    : [];

  // For funds, count unique borrowers and industries
  const uniqueIndustries = isFund
    ? Array.from(new Set(relatedHoldings.map((h) => h.industry)))
    : [];

  // Stress test result for borrowers
  const stressResult = !isFund && showStressTest ? getStressTestImpact(node.id, haircut) : null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-zinc-900/95 backdrop-blur-sm border-l border-zinc-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${isFund ? "ring-2 ring-white/50" : ""}`}
              style={{ backgroundColor: node.color }}
            />
            <span className="text-xs text-zinc-500 uppercase tracking-wide">
              {isFund ? "Fund" : "Borrower"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            {isFund ? node.ticker : node.name}
          </h2>
          {isFund && (
            <p className="text-sm text-zinc-400">{node.name}</p>
          )}
          {node.industry && (
            <p className="text-xs text-zinc-500 mt-1">{node.industry}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-zinc-500 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-zinc-800">
        <div>
          <div className="text-xs text-zinc-500">Total Exposure</div>
          <div className="text-lg font-bold text-white">${totalExposure.toFixed(1)}M</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Avg Rate</div>
          <div className="text-lg font-bold text-white">{avgRate.toFixed(2)}%</div>
        </div>
        {isFund && (
          <>
            <div>
              <div className="text-xs text-zinc-500">Holdings</div>
              <div className="text-lg font-bold text-white">{relatedHoldings.length}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Industries</div>
              <div className="text-lg font-bold text-white">{uniqueIndustries.length}</div>
            </div>
          </>
        )}
        {!isFund && (
          <>
            <div>
              <div className="text-xs text-zinc-500">Funds</div>
              <div className="text-lg font-bold text-white">{fundingFunds.length}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Positions</div>
              <div className="text-lg font-bold text-white">{relatedHoldings.length}</div>
            </div>
          </>
        )}
      </div>

      {/* Stress Test Toggle - Borrowers Only */}
      {!isFund && fundingFunds.length > 1 && (
        <div className="px-4 py-3 border-b border-zinc-800">
          <button
            onClick={() => setShowStressTest(!showStressTest)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              showStressTest
                ? "bg-amber-500/20 border border-amber-500/30"
                : "bg-zinc-800/50 hover:bg-zinc-800 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${showStressTest ? "text-amber-400" : "text-zinc-400"}`} />
              <span className={`text-sm font-medium ${showStressTest ? "text-amber-400" : "text-zinc-300"}`}>
                Stress Test
              </span>
            </div>
            <span className="text-xs text-zinc-500">
              {showStressTest ? "Hide" : "Simulate default"}
            </span>
          </button>

          {showStressTest && stressResult && (
            <div className="mt-4 space-y-4">
              {/* Haircut Slider */}
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

              {/* Impact Summary */}
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

              {/* Fund Impact Table */}
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                  Impact by Fund
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {stressResult.fundImpacts.map((impact) => (
                    <div
                      key={impact.fund.id}
                      className="flex items-center justify-between text-xs bg-zinc-800/30 rounded px-2 py-1.5"
                    >
                      <span className="ticker-badge text-[10px]">{impact.fund.ticker}</span>
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
      )}

      {/* Related entities */}
      <div className="flex-1 overflow-y-auto p-4">
        {isFund ? (
          <>
            <h3 className="text-sm font-medium text-white mb-3">Top Holdings</h3>
            <div className="space-y-2">
              {relatedHoldings
                .sort((a, b) => b.fairValue - a.fairValue)
                .slice(0, 10)
                .map((holding) => (
                  <div
                    key={holding.id}
                    className="p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {holding.borrowerName}
                        </div>
                        <div className="text-xs text-zinc-500">{holding.industry}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          ${holding.fairValue.toFixed(1)}M
                        </div>
                        <div className="text-xs text-zinc-500">{holding.rate.toFixed(2)}%</div>
                      </div>
                    </div>
                    {holding.maturity && (
                      <div className="text-[10px] text-zinc-600 mt-1">
                        Matures: {new Date(holding.maturity).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
            </div>
            {relatedHoldings.length > 10 && (
              <div className="text-xs text-zinc-500 mt-3 text-center">
                +{relatedHoldings.length - 10} more holdings
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="text-sm font-medium text-white mb-3">Financing Funds</h3>
            <div className="space-y-2">
              {(relatedHoldings as (Holding & { fund: Fund })[])
                .sort((a, b) => b.fairValue - a.fairValue)
                .map((holding) => (
                  <div
                    key={holding.id}
                    className="p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {holding.fund.ticker}
                        </div>
                        <div className="text-xs text-zinc-500">{holding.fund.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          ${holding.fairValue.toFixed(1)}M
                        </div>
                        <div className="text-xs text-zinc-500">{holding.rate.toFixed(2)}%</div>
                      </div>
                    </div>
                    {holding.maturity && (
                      <div className="text-[10px] text-zinc-600 mt-1">
                        Matures: {new Date(holding.maturity).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <Link
          href={isFund ? `/funds/${node.id}` : `/borrowers/${node.id}`}
          className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white text-center rounded-lg text-sm font-medium transition-colors"
        >
          View Full Details →
        </Link>
      </div>
    </div>
  );
}
