"use client";

import Link from "next/link";
import { GraphNode } from "./NetworkGraph";
import { Fund, Borrower, Holding, holdings, funds, borrowers, getFundsByBorrower, getHoldingsByFund } from "@/data";

interface NodeDetailPanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
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
