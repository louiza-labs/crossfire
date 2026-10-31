"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X } from "lucide-react";
import { funds, borrowers, holdings, getSharedBorrowers, getStats, getUniqueIndustries } from "@/data";
import { NetworkGraph, generateGraphData, GraphNode, GraphFilterState } from "@/components/NetworkGraph";
import { NodeDetailPanel } from "@/components/NodeDetailPanel";
import { ConcentratedBorrowersPanel } from "@/components/ConcentratedBorrowersPanel";
import { GraphFilters, defaultFilters } from "@/components/GraphFilters";
import { GraphLegend } from "@/components/GraphLegend";

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showIntro, setShowIntro] = useState(true);
  const [introPhase, setIntroPhase] = useState(0);
  const [windowHeight, setWindowHeight] = useState(800);
  const [showConcentrated, setShowConcentrated] = useState(false);
  const [focusedFundId, setFocusedFundId] = useState<string | null>(null);
  const [filters, setFilters] = useState<GraphFilterState>(defaultFilters);
  const [legendFilter, setLegendFilter] = useState<string | null>(null);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (focusedFundId) {
          setFocusedFundId(null);
        } else if (selectedNode) {
          setSelectedNode(null);
        } else if (searchQuery) {
          setSearchQuery("");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedFundId, selectedNode, searchQuery]);

  const sharedBorrowers = getSharedBorrowers();
  const stats = getStats();
  const industries = getUniqueIndustries();
  const graphData = useMemo(() => generateGraphData(funds, borrowers, holdings), []);
  const criticalCount = sharedBorrowers.filter(b => b.funds.length >= 4).length;

  // Intro animation sequence
  useEffect(() => {
    const phases = [
      { delay: 400, phase: 1 },
      { delay: 1200, phase: 2 },
      { delay: 2400, phase: 3 },
      { delay: 3200, phase: 4 },
    ];

    const timeouts = phases.map(({ delay, phase }) =>
      setTimeout(() => setIntroPhase(phase), delay)
    );

    const hideTimeout = setTimeout(() => setShowIntro(false), 3500);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  const handleFundFocus = useCallback((fundId: string | null) => {
    setFocusedFundId(fundId);
    if (fundId) setLegendFilter(null);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSelectedNode(null);
    setFocusedFundId(null);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      {/* Intro overlay */}
      {showIntro && (
        <div
          className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-700 ${
            introPhase >= 3 ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="text-center space-y-4">
            <h1
              className={`text-5xl md:text-7xl font-light tracking-tight text-white transition-all duration-700 ${
                introPhase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Crossfire
            </h1>
            <p
              className={`text-sm md:text-base text-zinc-600 font-mono transition-all duration-700 ${
                introPhase >= 2 ? "opacity-100" : "opacity-0"
              }`}
            >
              {graphData.nodes.length} entities · {sharedBorrowers.length} overlaps
            </p>
          </div>
        </div>
      )}

      {/* Main network visualization */}
      <div className="absolute inset-0">
        <NetworkGraph
          data={graphData}
          height={windowHeight}
          onNodeClick={handleNodeClick}
          onFundFocus={handleFundFocus}
          searchQuery={searchQuery}
          focusedFundId={focusedFundId}
          filters={filters}
        />
      </div>

      {/* Left sidebar */}
      <div className="fixed top-0 left-0 bottom-0 z-20 w-72 pointer-events-none">
        <div className="h-full flex flex-col px-6 py-6 bg-gradient-to-r from-black/95 via-black/70 to-transparent">
          {/* Header with branding */}
          <div className="mb-6 pointer-events-auto">
            <h1 className="text-xl font-semibold text-white tracking-tight">Crossfire</h1>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5">Private Credit Network</p>
          </div>

          {/* Search Bar */}
          <div className="mb-6 pointer-events-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search funds, companies..."
                className="w-full h-9 pl-9 pr-8 bg-zinc-900/80 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6 pointer-events-auto">
            <MetricCard
              value={`$${(stats.totalExposure / 1000).toFixed(0)}B`}
              label="Total Exposure"
              size="large"
            />
            <MetricCard
              value={funds.length.toString()}
              label="BDC Funds"
              color="cyan"
            />
            <MetricCard
              value={borrowers.length.toLocaleString()}
              label="Companies"
              color="muted"
            />
            <button onClick={() => setShowConcentrated(true)} className="text-left group">
              <MetricCard
                value={sharedBorrowers.length.toString()}
                label="Shared →"
                color="green"
              />
            </button>
          </div>

          {/* Critical Warning */}
          {criticalCount > 0 && (
            <div className="mb-6 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg pointer-events-auto">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium text-red-400">{criticalCount}</span>
                <span className="text-xs text-red-400/70">critical (4+ funds)</span>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mb-4 pointer-events-auto">
            <GraphLegend
              onFilterByType={setLegendFilter}
              activeType={legendFilter}
            />
          </div>

          {/* Filters */}
          <div className="pointer-events-auto">
            <GraphFilters
              filters={filters}
              onChange={setFilters}
              industries={industries}
            />
          </div>

          {/* Controls hint */}
          <div className="mt-auto pt-4">
            <div className="text-[9px] text-zinc-700 font-mono space-y-0.5">
              <div>Drag to rotate · Scroll to zoom</div>
              <div>Click node to select · ESC to clear</div>
            </div>
          </div>
        </div>
      </div>

      {/* Node detail panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Concentrated borrowers panel */}
      <ConcentratedBorrowersPanel
        isOpen={showConcentrated}
        onClose={() => setShowConcentrated(false)}
        onBorrowerClick={(borrowerId) => {
          const borrower = graphData.nodes.find(n => n.id === borrowerId);
          if (borrower) {
            setSelectedNode(borrower);
            setSearchQuery(borrower.name);
          }
          setShowConcentrated(false);
        }}
      />
    </div>
  );
}

// Metric card component
function MetricCard({
  value,
  label,
  color = "default",
  size = "normal",
}: {
  value: string;
  label: string;
  color?: "default" | "cyan" | "green" | "muted";
  size?: "normal" | "large";
}) {
  const valueColor = {
    default: "text-white",
    cyan: "text-cyan-400",
    green: "text-emerald-400",
    muted: "text-zinc-400",
  }[color];

  const dotColor = {
    default: "bg-white",
    cyan: "bg-cyan-400",
    green: "bg-emerald-400",
    muted: "bg-zinc-600",
  }[color];

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className={`${size === "large" ? "text-xl" : "text-lg"} font-semibold tabular-nums ${valueColor}`}>
          {value}
        </span>
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      </div>
      <div className="text-[9px] text-zinc-600 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
