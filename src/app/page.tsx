"use client";

import { useState, useEffect, useCallback, useMemo, useDeferredValue, useTransition } from "react";
import { Search, X, PanelLeftClose, PanelLeft, Zap, ChevronDown } from "lucide-react";
import {
  funds,
  borrowers,
  holdings,
  getSharedBorrowers,
  getStats,
  getUniqueIndustries,
} from "@/data";
import {
  NetworkGraph,
  generateGraphData,
  GraphNode,
  GraphFilterState,
} from "@/components/NetworkGraph";
import { NodeDetailPanel } from "@/components/NodeDetailPanel";
import { ConcentratedBorrowersPanel } from "@/components/ConcentratedBorrowersPanel";
import { GraphFilters, defaultFilters } from "@/components/GraphFilters";
import { GraphLegend } from "@/components/GraphLegend";

// Read sidebar state from cookie
function getSidebarState(): boolean {
  if (typeof document === "undefined") return true;
  const match = document.cookie.match(/(?:^|;\s*)sidebar=([^;]*)/);
  return match ? match[1] !== "collapsed" : true;
}

// Save sidebar state to cookie
function setSidebarCookie(expanded: boolean) {
  document.cookie = `sidebar=${expanded ? "expanded" : "collapsed"}; path=/; max-age=31536000; SameSite=Lax`;
}

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

  // Sidebar collapse state with cookie persistence
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Performance mode for mobile/low-end devices
  const [performanceMode, setPerformanceMode] = useState(false);

  // React 19 concurrent features for smoother filtering
  const [isPending, startTransition] = useTransition();
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Initialize sidebar state from cookie and detect mobile
  useEffect(() => {
    // Defer state updates to avoid cascading render warning
    queueMicrotask(() => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, default to collapsed; on desktop, read from cookie
      setSidebarExpanded(mobile ? false : getSidebarState());
      // Auto-enable performance mode on mobile
      setPerformanceMode(mobile);
      // On mobile, hide single-fund borrowers by default (reduces 5000+ nodes to ~500)
      if (mobile) {
        setFilters((prev) => ({ ...prev, showSingleFundBorrowers: false }));
      }
    });
  }, []);

  // Handle sidebar toggle with cookie persistence
  const toggleSidebar = useCallback(() => {
    setSidebarExpanded((prev) => {
      const newState = !prev;
      if (!isMobile) setSidebarCookie(newState);
      return newState;
    });
  }, [isMobile]);

  useEffect(() => {
    // Defer initial state update to avoid cascading render warning
    queueMicrotask(() => {
      setWindowHeight(window.innerHeight);
    });
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse on mobile resize
      if (mobile && sidebarExpanded) {
        setSidebarExpanded(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarExpanded]);

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
  const criticalCount = sharedBorrowers.filter((b) => b.funds.length >= 4).length;
  const hasActiveFilters =
    filters.industryFilter !== null ||
    filters.minExposure > 0 ||
    !filters.showFundLinks ||
    !filters.showSingleFundBorrowers;

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

  // Use transition for filter changes to keep UI responsive
  const handleFilterChange = useCallback((newFilters: GraphFilterState) => {
    startTransition(() => {
      setFilters(newFilters);
    });
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
          searchQuery={deferredSearchQuery}
          focusedFundId={focusedFundId}
          filters={filters}
          performanceMode={performanceMode}
        />
      </div>

      {/* Sidebar toggle button - minimal design */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-30 p-2.5 bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/[0.06] rounded-lg text-white/50 hover:text-white/90 hover:border-white/[0.12] transition-all duration-200 touch-target"
        aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarExpanded ? (
          <PanelLeftClose className="w-4 h-4" />
        ) : (
          <PanelLeft className="w-4 h-4" />
        )}
      </button>

      {/* Performance mode toggle - minimal design */}
      <button
        onClick={() => setPerformanceMode((p) => !p)}
        className={`fixed top-4 z-30 p-2.5 bg-[#0a0a0c]/90 backdrop-blur-xl border rounded-lg transition-all duration-200 touch-target ${
          sidebarExpanded ? "left-[17rem]" : "left-14"
        } ${
          performanceMode
            ? "border-[#fbbf24]/30 text-[#fbbf24]"
            : "border-white/[0.06] text-white/50 hover:text-white/90 hover:border-white/[0.12]"
        }`}
        aria-label={performanceMode ? "Disable performance mode" : "Enable performance mode"}
        title={performanceMode ? "Performance mode ON" : "Performance mode OFF"}
      >
        <Zap className="w-4 h-4" />
      </button>

      {/* Mobile warning - subtle design */}
      {isMobile && filters.showSingleFundBorrowers && (
        <div className="fixed top-16 left-4 right-4 z-30 p-3 bg-[#fbbf24]/[0.06] backdrop-blur-xl border border-[#fbbf24]/[0.15] rounded-lg">
          <div className="flex items-center gap-2 text-[#fbbf24]/80 text-[11px]">
            <Zap className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-light">
              Heavy graph mode. Toggle off single-fund positions in filters.
            </span>
          </div>
        </div>
      )}

      {/* Left sidebar */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-20 transition-all duration-300 ease-out pointer-events-none ${
          sidebarExpanded ? "w-72 translate-x-0" : "w-72 -translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col bg-gradient-to-r from-[#050506]/98 via-[#050506]/90 to-transparent">
          {/* Fixed header */}
          <div className="flex-shrink-0 px-5 pt-16 pb-4 pointer-events-auto">
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 transition-colors group-focus-within:text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search funds or borrowers..."
                className="w-full h-9 pl-9 pr-8 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.04] transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-4 pointer-events-auto scrollbar-thin">
            {/* Critical Warning - always visible if present */}
            {criticalCount > 0 && (
              <div className="mb-4 px-3 py-2.5 bg-[#f87171]/[0.06] border border-[#f87171]/[0.12] rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f87171] animate-pulse-subtle" />
                  <span className="text-sm font-light tabular-nums text-[#f87171]">
                    {criticalCount}
                  </span>
                  <span className="text-[10px] text-[#f87171]/60 tracking-wide">
                    critical borrowers
                  </span>
                </div>
              </div>
            )}

            {/* Stats Section */}
            <CollapsibleSection title="Overview" defaultOpen>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  value={`$${(stats.totalExposure / 1000).toFixed(0)}B`}
                  label="Exposure"
                  size="large"
                />
                <MetricCard value={funds.length.toString()} label="Funds" accent />
                <MetricCard value={borrowers.length.toLocaleString()} label="Companies" />
                <button onClick={() => setShowConcentrated(true)} className="text-left group">
                  <MetricCard
                    value={sharedBorrowers.length.toString()}
                    label="Shared"
                    accent
                    interactive
                  />
                </button>
              </div>
            </CollapsibleSection>

            {/* Legend Section */}
            <CollapsibleSection title="Legend" defaultOpen>
              <GraphLegend onFilterByType={setLegendFilter} activeType={legendFilter} />
            </CollapsibleSection>

            {/* Filters Section */}
            <CollapsibleSection title="Filters" defaultOpen badge={hasActiveFilters}>
              <GraphFilters
                filters={filters}
                onChange={handleFilterChange}
                industries={industries}
                inline
              />
              {isPending && (
                <div className="mt-2 text-[10px] text-amber-400/70 font-mono">
                  Updating graph...
                </div>
              )}
            </CollapsibleSection>
          </div>

          {/* Fixed footer */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.04] pointer-events-auto">
            <div className="text-[9px] text-white/20 font-mono tracking-wide space-y-1">
              <div>Drag to rotate · Scroll to zoom</div>
              <div>Click node to select · ESC to clear</div>
            </div>
          </div>
        </div>
      </div>

      {/* Node detail panel */}
      {selectedNode && (
        <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}

      {/* Concentrated borrowers panel */}
      <ConcentratedBorrowersPanel
        isOpen={showConcentrated}
        onClose={() => setShowConcentrated(false)}
        onBorrowerClick={(borrowerId) => {
          const borrower = graphData.nodes.find((n) => n.id === borrowerId);
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

// Metric card component - 2026 minimal design
function MetricCard({
  value,
  label,
  size = "normal",
  accent = false,
  interactive = false,
}: {
  value: string;
  label: string;
  size?: "normal" | "large";
  accent?: boolean;
  interactive?: boolean;
}) {
  return (
    <div
      className={`
      bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2.5
      ${interactive ? "group-hover:border-white/[0.08] group-hover:bg-white/[0.03] transition-all duration-300" : ""}
    `}
    >
      <div
        className={`
        ${size === "large" ? "text-xl" : "text-lg"}
        font-light tabular-nums tracking-tight
        ${accent ? "text-[#e0f2fe]" : "text-white/90"}
      `}
      >
        {value}
      </div>
      <div
        className={`
        text-[9px] uppercase tracking-[0.14em] mt-1 font-medium
        ${accent ? "text-[#e0f2fe]/40" : "text-white/30"}
        ${interactive ? "group-hover:text-white/50 transition-colors" : ""}
      `}
      >
        {label}
        {interactive && (
          <span className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
        )}
      </div>
    </div>
  );
}

// Collapsible section component
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  badge = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 uppercase tracking-[0.12em] font-medium group-hover:text-white/60 transition-colors">
            {title}
          </span>
          {badge && <span className="w-1.5 h-1.5 rounded-full bg-[#e0f2fe]" />}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
