"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import * as THREE from "three";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface GraphNode {
  id: string;
  name: string;
  type: "fund" | "borrower";
  ticker?: string;
  industry?: string;
  val: number;
  color: string;
  x?: number;
  y?: number;
  z?: number;
  fundCount?: number;
  fairValue?: number;
  totalAssets?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
  color: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphFilterState {
  showFundLinks: boolean;
  showSingleFundBorrowers: boolean;
  industryFilter: string | null;
  minExposure: number;
}

interface NetworkGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  onFundFocus?: (fundId: string | null) => void;
  height?: number;
  searchQuery?: string;
  highlightNodeId?: string | null;
  showSearch?: boolean;
  focusedFundId?: string | null;
  filters?: GraphFilterState;
}

const defaultFilters: GraphFilterState = {
  showFundLinks: true,
  showSingleFundBorrowers: true,
  industryFilter: null,
  minExposure: 0,
};

export function NetworkGraph({
  data,
  onNodeClick,
  onNodeHover,
  onFundFocus,
  height = 600,
  searchQuery = "",
  highlightNodeId = null,
  showSearch = false,
  focusedFundId = null,
  filters = defaultFilters,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");

  // Store callbacks in refs to avoid stale closures
  const onNodeClickRef = useRef(onNodeClick);
  const onNodeHoverRef = useRef(onNodeHover);
  const onFundFocusRef = useRef(onFundFocus);
  const focusedFundIdRef = useRef(focusedFundId);

  useEffect(() => { onNodeClickRef.current = onNodeClick; }, [onNodeClick]);
  useEffect(() => { onNodeHoverRef.current = onNodeHover; }, [onNodeHover]);
  useEffect(() => { onFundFocusRef.current = onFundFocus; }, [onFundFocus]);
  useEffect(() => { focusedFundIdRef.current = focusedFundId; }, [focusedFundId]);

  // Reset camera to default position
  const resetCamera = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.cameraPosition({ x: 0, y: 0, z: 800 }, { x: 0, y: 0, z: 0 }, 1000);
    }
  }, []);

  const activeSearch = searchQuery || localSearch;

  // Filter data based on filters prop
  const filteredData = useMemo(() => {
    let nodes = [...data.nodes];
    let links = [...data.links];

    // Filter by industry
    if (filters.industryFilter) {
      const matchingBorrowerIds = new Set(
        nodes
          .filter(n => n.type === "borrower" && n.industry === filters.industryFilter)
          .map(n => n.id)
      );
      nodes = nodes.filter(n => n.type === "fund" || matchingBorrowerIds.has(n.id));
    }

    // Filter by minimum exposure
    if (filters.minExposure > 0) {
      nodes = nodes.filter(n => n.type === "fund" || (n.fairValue && n.fairValue >= filters.minExposure));
    }

    // Filter single-fund borrowers
    if (!filters.showSingleFundBorrowers) {
      nodes = nodes.filter(n => n.type === "fund" || (n.fundCount && n.fundCount > 1));
    }

    // Get valid node IDs for link filtering
    const validNodeIds = new Set(nodes.map(n => n.id));

    // Filter links
    links = links.filter(link => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;

      // Remove fund-to-fund links if disabled
      if (!filters.showFundLinks) {
        const isFundToFund = sourceId.startsWith("f") && targetId.startsWith("f");
        if (isFundToFund) return false;
      }

      return validNodeIds.has(sourceId) && validNodeIds.has(targetId);
    });

    return { nodes, links };
  }, [data, filters]);

  // Build adjacency map for highlight logic
  const adjacencyMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    filteredData.nodes.forEach((n) => map.set(n.id, new Set()));
    filteredData.links.forEach((link) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      map.get(sourceId)?.add(targetId);
      map.get(targetId)?.add(sourceId);
    });
    return map;
  }, [filteredData]);

  // Get highlighted node IDs (for hover/search highlight)
  const highlightedIds = useMemo(() => {
    const focusId = highlightNodeId || hoveredNode?.id;
    if (!focusId) return null;
    const connected = adjacencyMap.get(focusId) || new Set();
    return new Set([focusId, ...connected]);
  }, [highlightNodeId, hoveredNode, adjacencyMap]);

  // Fund focus mode - show only focused fund and its borrowers
  const focusedFundIds = useMemo(() => {
    if (!focusedFundId) return null;
    const connected = adjacencyMap.get(focusedFundId) || new Set();
    return new Set([focusedFundId, ...connected]);
  }, [focusedFundId, adjacencyMap]);

  // Search-matched node IDs
  const searchMatchIds = useMemo(() => {
    if (!activeSearch.trim()) return null;
    const query = activeSearch.toLowerCase();
    return new Set(
      filteredData.nodes
        .filter(
          (n) =>
            n.name.toLowerCase().includes(query) ||
            (n.ticker && n.ticker.toLowerCase().includes(query)) ||
            (n.industry && n.industry.toLowerCase().includes(query))
        )
        .map((n) => n.id)
    );
  }, [activeSearch, filteredData.nodes]);

  // Store highlight state in refs for use in graph callbacks
  const highlightedIdsRef = useRef(highlightedIds);
  const focusedFundIdsRef = useRef(focusedFundIds);
  const searchMatchIdsRef = useRef(searchMatchIds);

  useEffect(() => { highlightedIdsRef.current = highlightedIds; }, [highlightedIds]);
  useEffect(() => { focusedFundIdsRef.current = focusedFundIds; }, [focusedFundIds]);
  useEffect(() => { searchMatchIdsRef.current = searchMatchIds; }, [searchMatchIds]);

  // Track mouse position for tooltip
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (hoveredNode) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [hoveredNode]);

  // Initialize graph ONCE
  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    import("3d-force-graph").then((module) => {
      if (!mounted || !containerRef.current) return;

      const ForceGraph3D = module.default as any;
      const width = containerRef.current.offsetWidth;

      const graph = ForceGraph3D()(containerRef.current)
        .width(width)
        .height(height)
        .backgroundColor("#000000")
        .graphData(filteredData)
        .nodeId("id")
        .nodeVal((node: any) => {
          const n = node as GraphNode;
          const isShared = n.type === "borrower" && (n.fundCount ?? 0) > 1;
          return n.type === "fund" ? 3 : isShared ? 1.5 + (n.fundCount ?? 0) * 0.3 : 0.5;
        })
        .nodeLabel(() => "")
        .nodeColor((node: any) => {
          const n = node as GraphNode;
          const shouldDim =
            (focusedFundIdsRef.current && !focusedFundIdsRef.current.has(n.id)) ||
            (highlightedIdsRef.current && !highlightedIdsRef.current.has(n.id)) ||
            (searchMatchIdsRef.current && !searchMatchIdsRef.current.has(n.id));
          if (shouldDim) return "rgba(50,50,50,0.3)";
          return n.color;
        })
        .nodeOpacity(0.9)
        .nodeResolution(16)
        .nodeThreeObject((node: any) => {
          const n = node as GraphNode;
          const isShared = n.type === "borrower" && (n.fundCount ?? 0) > 1;
          const shouldDim =
            (focusedFundIdsRef.current && !focusedFundIdsRef.current.has(n.id)) ||
            (highlightedIdsRef.current && !highlightedIdsRef.current.has(n.id)) ||
            (searchMatchIdsRef.current && !searchMatchIdsRef.current.has(n.id));

          const group = new THREE.Group();
          let color = n.color;
          if (shouldDim) color = "#1a1a1a";

          const coreSize = n.type === "fund" ? 4 : isShared ? 2 + (n.fundCount ?? 0) * 0.5 : 1;
          const coreGeometry = new THREE.SphereGeometry(coreSize, 16, 16);
          const coreMaterial = new THREE.MeshBasicMaterial({
            color: shouldDim ? 0x1a1a1a : new THREE.Color(color),
            transparent: true,
            opacity: shouldDim ? 0.2 : 1,
          });
          const core = new THREE.Mesh(coreGeometry, coreMaterial);
          group.add(core);

          if (!shouldDim) {
            const spriteMaterial = new THREE.SpriteMaterial({
              map: createGlowTexture(color),
              transparent: true,
              blending: THREE.AdditiveBlending,
              opacity: isShared ? 0.6 : 0.3,
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            const glowSize = coreSize * (isShared ? 8 : 5);
            sprite.scale.set(glowSize, glowSize, 1);
            group.add(sprite);
          }

          if (n.type === "fund" && n.ticker) {
            const labelSprite = createTextSprite(n.ticker, shouldDim ? "#333333" : color, 48);
            labelSprite.position.set(0, coreSize + 12, 0);
            group.add(labelSprite);
          }

          return group;
        })
        .linkColor((link: any) => {
          const l = link as GraphLink;
          const sourceId = typeof l.source === "string" ? l.source : l.source.id;
          const targetId = typeof l.target === "string" ? l.target : l.target.id;
          const isFundToFund = sourceId.startsWith("f") && targetId.startsWith("f");

          if (focusedFundIdsRef.current) {
            const isConnected = focusedFundIdsRef.current.has(sourceId) && focusedFundIdsRef.current.has(targetId);
            if (isConnected) {
              return isFundToFund ? "rgba(16, 185, 129, 0.8)" : "rgba(255,255,255,0.5)";
            }
            return "rgba(255,255,255,0.02)";
          }

          if (highlightedIdsRef.current) {
            const isConnected = highlightedIdsRef.current.has(sourceId) && highlightedIdsRef.current.has(targetId);
            if (isConnected) {
              return isFundToFund ? "rgba(16, 185, 129, 0.8)" : "rgba(255,255,255,0.4)";
            }
            return isFundToFund ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.02)";
          }

          if (searchMatchIdsRef.current) {
            const matches = searchMatchIdsRef.current.has(sourceId) || searchMatchIdsRef.current.has(targetId);
            return matches ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.02)";
          }

          return isFundToFund ? l.color : "rgba(255,255,255,0.04)";
        })
        .linkWidth((link: any) => {
          const l = link as GraphLink;
          const sourceId = typeof l.source === "string" ? l.source : l.source.id;
          const targetId = typeof l.target === "string" ? l.target : l.target.id;
          const isFundToFund = sourceId.startsWith("f") && targetId.startsWith("f");

          if (focusedFundIdsRef.current && focusedFundIdsRef.current.has(sourceId) && focusedFundIdsRef.current.has(targetId)) {
            return isFundToFund ? 3 : 2;
          }

          if (highlightedIdsRef.current && highlightedIdsRef.current.has(sourceId) && highlightedIdsRef.current.has(targetId)) {
            return isFundToFund ? 3 : 1.5;
          }
          return isFundToFund ? 1.5 : 0.3;
        })
        .linkOpacity(0.6)
        .linkDirectionalParticles((link: any) => {
          const l = link as GraphLink;
          const sourceId = typeof l.source === "string" ? l.source : l.source.id;
          const targetId = typeof l.target === "string" ? l.target : l.target.id;
          if (highlightedIdsRef.current && highlightedIdsRef.current.has(sourceId) && highlightedIdsRef.current.has(targetId)) {
            return 2;
          }
          return 0;
        })
        .linkDirectionalParticleWidth(1)
        .linkDirectionalParticleSpeed(0.005)
        .linkDirectionalParticleColor(() => "rgba(255,255,255,0.8)")
        .onNodeClick((node: any) => {
          const n = node as GraphNode;
          if (n.type === "fund") {
            onFundFocusRef.current?.(focusedFundIdRef.current === n.id ? null : n.id);
          }
          onNodeClickRef.current?.(n);
        })
        .onNodeHover((node: any) => {
          setHoveredNode(node as GraphNode | null);
          onNodeHoverRef.current?.(node as GraphNode | null);
          if (containerRef.current) {
            containerRef.current.style.cursor = node ? "pointer" : "default";
          }
        })
        .cooldownTicks(200)
        .onEngineStop(() => {
          graph.cameraPosition({ x: 0, y: 0, z: 800 }, { x: 0, y: 0, z: 0 }, 1500);
        });

      graph.d3Force("charge")?.strength(-40);
      graph.d3Force("link")?.distance(60);
      graph.d3Force("center")?.strength(0.03);

      const controls = graph.controls();
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.rotateSpeed = 0.5;
      controls.zoomSpeed = 0.8;
      controls.minDistance = 100;
      controls.maxDistance = 2000;

      graphRef.current = graph;
      setIsLoading(false);

      const handleResize = () => {
        if (containerRef.current && graphRef.current) {
          graphRef.current.width(containerRef.current.offsetWidth);
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    });

    return () => {
      mounted = false;
      if (graphRef.current) {
        graphRef.current._destructor?.();
        graphRef.current = null;
      }
    };
  // Only re-initialize on height change, not on data/filter changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // Update graph data when filters change (without recreating graph)
  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current.graphData(filteredData);
  }, [filteredData]);

  // Refresh visuals when highlights change
  useEffect(() => {
    if (!graphRef.current) return;
    // Force re-render of node colors and link styles
    graphRef.current.nodeColor(graphRef.current.nodeColor());
    graphRef.current.linkColor(graphRef.current.linkColor());
    graphRef.current.linkWidth(graphRef.current.linkWidth());
    graphRef.current.nodeThreeObject(graphRef.current.nodeThreeObject());
  }, [highlightedIds, searchMatchIds, focusedFundIds]);

  // Get connected nodes info for tooltip
  const connectedInfo = useMemo(() => {
    if (!hoveredNode) return null;
    const connected = adjacencyMap.get(hoveredNode.id);
    if (!connected) return null;

    const connectedNodes = filteredData.nodes.filter((n) => connected.has(n.id));
    const funds = connectedNodes.filter((n) => n.type === "fund");
    const borrowers = connectedNodes.filter((n) => n.type === "borrower");

    return { funds, borrowers };
  }, [hoveredNode, adjacencyMap, filteredData.nodes]);

  return (
    <div className="relative">
      {showSearch && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <input
            type="text"
            placeholder="Search borrowers, funds, industries..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-80 px-4 py-2 bg-black/80 backdrop-blur-md border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors font-mono"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full overflow-hidden"
        style={{ height }}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border border-cyan-500/20 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-t border-cyan-400 rounded-full animate-spin" />
              <div className="absolute inset-3 w-10 h-10 border border-pink-500/20 rounded-full" />
              <div className="absolute inset-3 w-10 h-10 border-t border-pink-400 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.6s" }} />
            </div>
            <div className="text-xs font-mono text-zinc-600 tracking-wider">INITIALIZING WEBGL</div>
          </div>
        </div>
      )}

      {/* Focus mode indicator */}
      {focusedFundId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 backdrop-blur-md border border-cyan-500/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm text-cyan-300 font-medium">
              Focus: {filteredData.nodes.find(n => n.id === focusedFundId)?.ticker || "Fund"}
            </span>
            <button
              onClick={() => onFundFocus?.(null)}
              className="ml-2 text-cyan-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      {!isLoading && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-1">
          <button
            onClick={() => {
              if (graphRef.current) {
                const camera = graphRef.current.camera();
                graphRef.current.cameraPosition(
                  { x: camera.position.x * 0.7, y: camera.position.y * 0.7, z: camera.position.z * 0.7 },
                  { x: 0, y: 0, z: 0 },
                  300
                );
              }
            }}
            className="w-8 h-8 flex items-center justify-center bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (graphRef.current) {
                const camera = graphRef.current.camera();
                graphRef.current.cameraPosition(
                  { x: camera.position.x * 1.4, y: camera.position.y * 1.4, z: camera.position.z * 1.4 },
                  { x: 0, y: 0, z: 0 },
                  300
                );
              }
            }}
            className="w-8 h-8 flex items-center justify-center bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={resetCamera}
            className="w-8 h-8 flex items-center justify-center bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-[10px] font-mono"
          >
            ⟲
          </button>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredNode && (
        <div
          className="fixed z-50 bg-black/95 backdrop-blur-xl border border-zinc-700/50 rounded-lg p-4 shadow-2xl pointer-events-none"
          style={{
            left: Math.min(mousePos.x + 16, window.innerWidth - 260),
            top: Math.min(mousePos.y + 16, window.innerHeight - 200),
            maxWidth: 240,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: hoveredNode.color, boxShadow: `0 0 8px ${hoveredNode.color}` }}
            />
            <span className="text-[9px] font-medium tracking-wider text-zinc-500 uppercase">
              {hoveredNode.type === "fund" ? "Fund" : hoveredNode.fundCount && hoveredNode.fundCount > 1 ? "Shared" : "Position"}
            </span>
          </div>

          <h3 className="text-base font-semibold text-white leading-tight">
            {hoveredNode.type === "fund" ? hoveredNode.ticker : hoveredNode.name}
          </h3>
          {hoveredNode.type === "fund" && (
            <p className="text-zinc-500 text-xs mt-0.5">{hoveredNode.name}</p>
          )}

          {hoveredNode.type === "borrower" && hoveredNode.industry && hoveredNode.industry !== "Unknown" && (
            <p className="text-zinc-500 text-xs mt-2 line-clamp-2">
              {hoveredNode.industry}
            </p>
          )}

          {hoveredNode.fairValue && hoveredNode.fairValue > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-800/50 flex justify-between items-baseline">
              <span className="text-[9px] font-medium tracking-wider text-zinc-600 uppercase">
                Exposure
              </span>
              <span className="text-lg font-semibold text-white">
                ${hoveredNode.fairValue >= 1000
                  ? `${(hoveredNode.fairValue / 1000).toFixed(1)}B`
                  : `${hoveredNode.fairValue.toFixed(0)}M`}
              </span>
            </div>
          )}

          {hoveredNode.type === "fund" && hoveredNode.totalAssets && (
            <div className="mt-3 pt-3 border-t border-zinc-800/50 flex justify-between items-baseline">
              <span className="text-[9px] font-medium tracking-wider text-zinc-600 uppercase">
                AUM
              </span>
              <span className="text-lg font-semibold text-white">
                ${hoveredNode.totalAssets >= 1000
                  ? `${(hoveredNode.totalAssets / 1000).toFixed(1)}B`
                  : `${hoveredNode.totalAssets.toFixed(0)}M`}
              </span>
            </div>
          )}

          {connectedInfo && hoveredNode.type === "borrower" && connectedInfo.funds.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-800/50">
              <div className="flex flex-wrap gap-1">
                {connectedInfo.funds.slice(0, 4).map((f) => (
                  <span
                    key={f.id}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400"
                  >
                    {f.ticker || f.name.split(" ")[0]}
                  </span>
                ))}
                {connectedInfo.funds.length > 4 && (
                  <span className="text-[10px] text-zinc-600">+{connectedInfo.funds.length - 4}</span>
                )}
              </div>
            </div>
          )}

          {connectedInfo && hoveredNode.type === "fund" && connectedInfo.borrowers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-800/50 flex justify-between items-baseline">
              <span className="text-[9px] font-medium tracking-wider text-zinc-600 uppercase">
                Positions
              </span>
              <span className="text-lg font-semibold text-white">
                {connectedInfo.borrowers.length}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Create glow texture for sprites
function createGlowTexture(color: string): any {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.2, color + "80");
  gradient.addColorStop(0.5, color + "20");
  gradient.addColorStop(1, "transparent");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Create text sprite for labels
function createTextSprite(text: string, color: string, size: number): any {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = 512;
  canvas.height = 128;

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.beginPath();
  ctx.roundRect(128, 32, 256, 64, 8);
  ctx.fill();

  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.font = `700 ${size}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(text, 256, 64);
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(50, 12.5, 1);
  sprite.renderOrder = 999;

  return sprite;
}

// Helper function to generate graph data
export function generateGraphData(
  funds: Array<{ id: string; name: string; ticker: string; totalAssets?: number }>,
  borrowers: Array<{ id: string; name: string; industry: string }>,
  holdings: Array<{ fundId: string; borrowerId: string; fairValue: number }>
): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  const fundColors = [
    "#00d4ff", "#60a5fa", "#a78bfa", "#c084fc", "#38bdf8",
    "#22d3ee", "#818cf8", "#67e8f9", "#f472b6", "#fb923c",
  ];

  funds.forEach((fund, idx) => {
    nodes.push({
      id: fund.id,
      name: fund.name,
      ticker: fund.ticker,
      type: "fund",
      val: 100,
      color: fundColors[idx % fundColors.length],
      totalAssets: fund.totalAssets,
    });
  });

  const borrowerFundCount = new Map<string, number>();
  const borrowerFairValue = new Map<string, number>();
  holdings.forEach((h) => {
    borrowerFundCount.set(h.borrowerId, (borrowerFundCount.get(h.borrowerId) || 0) + 1);
    borrowerFairValue.set(h.borrowerId, (borrowerFairValue.get(h.borrowerId) || 0) + h.fairValue);
  });

  const borrowerIdsInHoldings = new Set(holdings.map((h) => h.borrowerId));
  borrowers
    .filter((b) => borrowerIdsInHoldings.has(b.id))
    .forEach((borrower) => {
      const fundCount = borrowerFundCount.get(borrower.id) || 1;
      const fairValue = borrowerFairValue.get(borrower.id) || 0;

      let color: string;
      if (fundCount >= 4) {
        color = "#ff3366";
      } else if (fundCount >= 3) {
        color = "#ff9500";
      } else if (fundCount >= 2) {
        color = "#00ff9f";
      } else {
        color = "#334155";
      }

      nodes.push({
        id: borrower.id,
        name: borrower.name,
        industry: borrower.industry,
        type: "borrower",
        val: fundCount > 1 ? 20 + fundCount * 10 : 10,
        color,
        fundCount,
        fairValue,
      });
    });

  holdings.forEach((holding) => {
    const fundNode = nodes.find((n) => n.id === holding.fundId);
    const borrowerNode = nodes.find((n) => n.id === holding.borrowerId);
    if (!fundNode || !borrowerNode) return;

    links.push({
      source: holding.fundId,
      target: holding.borrowerId,
      value: holding.fairValue / 50,
      color: "rgba(255,255,255,0.08)",
    });
  });

  const borrowerToFunds = new Map<string, Set<string>>();
  holdings.forEach((h) => {
    if (!borrowerToFunds.has(h.borrowerId)) {
      borrowerToFunds.set(h.borrowerId, new Set());
    }
    borrowerToFunds.get(h.borrowerId)!.add(h.fundId);
  });

  const fundPairLinks = new Map<string, number>();
  borrowerToFunds.forEach((fundIds) => {
    if (fundIds.size < 2) return;
    const fundArray = Array.from(fundIds);
    for (let i = 0; i < fundArray.length; i++) {
      for (let j = i + 1; j < fundArray.length; j++) {
        const key = [fundArray[i], fundArray[j]].sort().join("-");
        fundPairLinks.set(key, (fundPairLinks.get(key) || 0) + 1);
      }
    }
  });

  fundPairLinks.forEach((count, key) => {
    const [fundA, fundB] = key.split("-");
    const intensity = Math.min(count / 20, 1);
    links.push({
      source: fundA,
      target: fundB,
      value: count * 3,
      color: `rgba(16, 185, 129, ${0.3 + intensity * 0.5})`,
    });
  });

  return { nodes, links };
}
