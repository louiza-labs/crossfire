"use client";

import { useEffect, useState } from "react";

interface StatLineProps {
  label: string;
  value: string | number;
  unit?: string;
  delay?: number;
  highlight?: boolean;
}

function StatLine({ label, value, unit = "", delay = 0, highlight = false }: StatLineProps) {
  const [visible, setVisible] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(true);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;
    if (typeof value !== "number") return;

    const duration = 1000;
    const startTime = performance.now();
    const targetValue = value;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(targetValue * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [visible, value]);

  if (!visible) return null;

  const displayValue = typeof value === "number" ? animatedValue : value;

  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-zinc-800/50">
      <span className="text-zinc-500 text-sm font-light tracking-wide uppercase">
        {label}
      </span>
      <span
        className={`font-mono text-sm ${
          highlight ? "text-emerald-400" : "text-white"
        }`}
      >
        {displayValue}
        {unit && <span className="text-zinc-600 ml-1">{unit}</span>}
      </span>
    </div>
  );
}

interface FinancialStatementProps {
  stats: {
    totalFunds: number;
    totalManagers: number;
    totalBorrowers: number;
    totalHoldings: number;
    totalExposure: number;
    sharedBorrowerCount: number;
    avgRate: number;
  };
  delay?: number;
}

export function FinancialStatement({ stats, delay = 0 }: FinancialStatementProps) {
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHeaderVisible(true);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <div className="border border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
      {/* Header */}
      <div
        className={`border-b border-zinc-800 px-6 py-4 transition-opacity duration-500 ${
          headerVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-zinc-500">
              Portfolio Summary
            </h2>
            <p className="text-[10px] text-zinc-700 mt-0.5 font-mono">
              AS OF {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-1">
        <StatLine
          label="Total Assets"
          value={`$${(stats.totalExposure / 1000).toFixed(1)}B`}
          delay={delay + 100}
          highlight
        />
        <StatLine
          label="Active Funds"
          value={stats.totalFunds}
          delay={delay + 200}
        />
        <StatLine
          label="Fund Managers"
          value={stats.totalManagers}
          delay={delay + 300}
        />
        <StatLine
          label="Unique Borrowers"
          value={stats.totalBorrowers}
          delay={delay + 400}
        />
        <StatLine
          label="Total Positions"
          value={stats.totalHoldings}
          delay={delay + 500}
        />
        <StatLine
          label="Shared Borrowers"
          value={stats.sharedBorrowerCount}
          delay={delay + 600}
        />
        <StatLine
          label="Avg Yield"
          value={`${stats.avgRate.toFixed(2)}%`}
          delay={delay + 700}
        />
      </div>

      {/* Footer */}
      <div
        className={`border-t border-zinc-800 px-6 py-3 transition-opacity duration-500 ${
          headerVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDelay: `${delay + 800}ms` }}
      >
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600">
          <span>PRIVATE_CREDIT_INDEX</span>
          <span className="text-emerald-500">LIVE</span>
        </div>
      </div>
    </div>
  );
}
