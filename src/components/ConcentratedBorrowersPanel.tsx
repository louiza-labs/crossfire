"use client";

import { useMemo } from "react";
import { getSharedBorrowers, Fund, Borrower, Holding } from "@/data";

interface ConcentratedBorrowersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onBorrowerClick?: (borrowerId: string) => void;
}

interface SharedBorrower {
  borrower: Borrower;
  funds: Fund[];
  totalExposure: number;
  holdings: Holding[];
}

export function ConcentratedBorrowersPanel({
  isOpen,
  onClose,
  onBorrowerClick,
}: ConcentratedBorrowersPanelProps) {
  const sharedBorrowers = useMemo(() => getSharedBorrowers(), []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-medium text-white">
              Concentrated Positions
            </span>
            <span className="text-xs text-zinc-600 font-mono">
              {sharedBorrowers.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Description */}
        <div className="px-4 py-2 border-b border-zinc-800/30">
          <p className="text-[10px] text-zinc-600 font-mono">
            Borrowers appearing in multiple fund portfolios, sorted by fund count
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {sharedBorrowers.map((item: SharedBorrower, idx: number) => (
            <BorrowerRow
              key={item.borrower.id}
              item={item}
              rank={idx + 1}
              onClick={() => onBorrowerClick?.(item.borrower.id)}
            />
          ))}
        </div>

        {/* Footer stats */}
        <div className="px-4 py-3 border-t border-zinc-800/50 bg-zinc-900/50">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-zinc-600">Total concentrated exposure</span>
            <span className="text-emerald-400">
              $
              {(
                sharedBorrowers.reduce(
                  (sum: number, b: SharedBorrower) => sum + b.totalExposure,
                  0
                ) / 1000
              ).toFixed(1)}
              B
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BorrowerRow({
  item,
  rank,
  onClick,
}: {
  item: SharedBorrower;
  rank: number;
  onClick: () => void;
}) {
  const fundColors = [
    "bg-cyan-400",
    "bg-blue-400",
    "bg-violet-400",
    "bg-pink-400",
    "bg-amber-400",
    "bg-emerald-400",
  ];

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 border-b border-zinc-800/30 hover:bg-zinc-900/50 transition-colors text-left group"
    >
      <div className="flex items-start gap-3">
        {/* Rank */}
        <span className="text-[10px] font-mono text-zinc-700 w-4 pt-0.5">
          {rank}
        </span>

        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
              {item.borrower.name}
            </span>
          </div>

          {/* Industry */}
          <p className="text-[10px] text-zinc-600 truncate mt-0.5">
            {item.borrower.industry}
          </p>

          {/* Fund pills */}
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {item.funds.map((fund, idx) => (
              <span
                key={fund.id}
                className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${fundColors[idx % fundColors.length]} text-black`}
              >
                {fund.ticker}
              </span>
            ))}
          </div>
        </div>

        {/* Exposure */}
        <div className="text-right">
          <span className="text-xs font-mono text-zinc-400">
            ${item.totalExposure.toFixed(0)}M
          </span>
          <div className="text-[9px] text-zinc-600 mt-0.5">
            {item.funds.length} funds
          </div>
        </div>
      </div>
    </button>
  );
}

// Compact inline version for embedding in pages
export function ConcentratedBorrowersInline({
  limit = 10,
  onBorrowerClick,
  onShowAll,
}: {
  limit?: number;
  onBorrowerClick?: (borrowerId: string) => void;
  onShowAll?: () => void;
}) {
  const sharedBorrowers = useMemo(() => getSharedBorrowers().slice(0, limit), [limit]);

  return (
    <div className="space-y-1">
      {sharedBorrowers.map((item: SharedBorrower, idx: number) => (
        <button
          key={item.borrower.id}
          onClick={() => onBorrowerClick?.(item.borrower.id)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800/50 transition-colors group text-left"
        >
          <span className="text-[9px] font-mono text-zinc-700 w-3">
            {idx + 1}
          </span>
          <span className="flex-1 text-xs text-zinc-400 truncate group-hover:text-white transition-colors">
            {item.borrower.name}
          </span>
          <div className="flex items-center gap-0.5">
            {item.funds.slice(0, 3).map((fund) => (
              <span
                key={fund.id}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400/60"
              />
            ))}
            {item.funds.length > 3 && (
              <span className="text-[8px] text-zinc-600 ml-0.5">
                +{item.funds.length - 3}
              </span>
            )}
          </div>
        </button>
      ))}
      {onShowAll && (
        <button
          onClick={onShowAll}
          className="w-full text-[10px] text-zinc-600 hover:text-emerald-400 transition-colors py-1 font-mono"
        >
          show all →
        </button>
      )}
    </div>
  );
}
