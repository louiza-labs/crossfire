"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import * as THREE from "three";
import SpriteText from "three-spritetext";

// Throttle helper - limits how often a function can fire
function throttle<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      // Schedule a trailing call
      timeoutId = setTimeout(
        () => {
          lastCall = Date.now();
          timeoutId = null;
          fn(...args);
        },
        ms - (now - lastCall)
      );
    }
  }) as T;
}

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
  performanceMode?: boolean;
}

const defaultFilters: GraphFilterState = {
  showFundLinks: true,
  showSingleFundBorrowers: true,
  industryFilter: null,
  minExposure: 0,
};

// Shared geometry cache - reuse geometries across all nodes
const geometryCache = new Map<string, THREE.SphereGeometry>();
const textureCache = new Map<string, THREE.CanvasTexture>();

function getCachedGeometry(size: number, segments: number): THREE.SphereGeometry {
  const key = `${size}-${segments}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.SphereGeometry(size, segments, segments));
  }
  return geometryCache.get(key)!;
}

function getCachedGlowTexture(color: string): THREE.CanvasTexture {
  if (textureCache.has(color)) {
    return textureCache.get(color)!;
  }
  const texture = createGlowTextureInternal(color);
  textureCache.set(color, texture);
  return texture;
}

// Clear caches - call on unmount
function clearGraphCaches() {
  geometryCache.forEach((g) => g.dispose());
  geometryCache.clear();
  textureCache.forEach((t) => t.dispose());
  textureCache.clear();
}

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
  performanceMode = false,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Performance settings based on mode (SSR-safe)
  const perfSettings = useMemo(() => {
    const devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    const isMobileDevice = typeof window !== "undefined" && window.innerWidth < 768;
    return {
      // Geometry resolution: 16 normal, 8 performance mode, 6 for mobile
      sphereSegments: isMobileDevice ? 6 : performanceMode ? 8 : 16,
      // Pixel ratio: limit to 1 on mobile, 1.5 performance mode, 2 otherwise
      pixelRatio: isMobileDevice
        ? 1
        : performanceMode
          ? Math.min(devicePixelRatio, 1.5)
          : Math.min(devicePixelRatio, 2),
      // Glow effects: disabled in performance mode and mobile
      enableGlow: !performanceMode && !isMobileDevice,
      // Particle effects on links
      enableParticles: !performanceMode && !isMobileDevice,
      // Force simulation iterations - fewer on mobile
      cooldownTicks: isMobileDevice ? 50 : performanceMode ? 100 : 200,
      // Node resolution
      nodeResolution: isMobileDevice ? 6 : performanceMode ? 8 : 16,
      // Max nodes to render (prevents crashes on large datasets)
      maxNodes: isMobileDevice ? 300 : performanceMode ? 800 : 2000,
      // Whether on mobile
      isMobile: isMobileDevice,
      // Disable hover on mobile (touch causes issues)
      enableHover: !isMobileDevice,
    };
  }, [performanceMode]);

  // Store performance settings in ref to avoid stale closures
  const perfSettingsRef = useRef(perfSettings);
  useEffect(() => {
    perfSettingsRef.current = perfSettings;
  }, [perfSettings]);

  // Store callbacks in refs to avoid stale closures
  const onNodeClickRef = useRef(onNodeClick);
  const onNodeHoverRef = useRef(onNodeHover);
  const onFundFocusRef = useRef(onFundFocus);
  const focusedFundIdRef = useRef(focusedFundId);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);
  useEffect(() => {
    onNodeHoverRef.current = onNodeHover;
  }, [onNodeHover]);
  useEffect(() => {
    onFundFocusRef.current = onFundFocus;
  }, [onFundFocus]);
  useEffect(() => {
    focusedFundIdRef.current = focusedFundId;
  }, [focusedFundId]);

  // Ref for throttled hover setter (to use in graph callback)
  const throttledSetHoveredNodeRef = useRef<(node: GraphNode | null) => void>(() => {});

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
          .filter((n) => n.type === "borrower" && n.industry === filters.industryFilter)
          .map((n) => n.id)
      );
      nodes = nodes.filter((n) => n.type === "fund" || matchingBorrowerIds.has(n.id));
    }

    // Filter by minimum exposure
    if (filters.minExposure > 0) {
      nodes = nodes.filter(
        (n) => n.type === "fund" || (n.fairValue && n.fairValue >= filters.minExposure)
      );
    }

    // Filter single-fund borrowers
    if (!filters.showSingleFundBorrowers) {
      nodes = nodes.filter((n) => n.type === "fund" || (n.fundCount && n.fundCount > 1));
    }

    // Apply node limit for performance (prioritize funds and high-concentration borrowers)
    const maxNodes = perfSettings.maxNodes;
    if (nodes.length > maxNodes) {
      // Keep all funds
      const fundNodes = nodes.filter((n) => n.type === "fund");
      // Sort borrowers by fund count (most shared first) then by exposure
      const borrowerNodes = nodes
        .filter((n) => n.type === "borrower")
        .sort((a, b) => {
          const fundDiff = (b.fundCount ?? 0) - (a.fundCount ?? 0);
          if (fundDiff !== 0) return fundDiff;
          return (b.fairValue ?? 0) - (a.fairValue ?? 0);
        })
        .slice(0, maxNodes - fundNodes.length);

      nodes = [...fundNodes, ...borrowerNodes];
    }

    // Get valid node IDs for link filtering
    const validNodeIds = new Set(nodes.map((n) => n.id));

    // Filter links
    links = links.filter((link) => {
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
  }, [data, filters, perfSettings.maxNodes]);

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

  useEffect(() => {
    highlightedIdsRef.current = highlightedIds;
  }, [highlightedIds]);
  useEffect(() => {
    focusedFundIdsRef.current = focusedFundIds;
  }, [focusedFundIds]);
  useEffect(() => {
    searchMatchIdsRef.current = searchMatchIds;
  }, [searchMatchIds]);

  // Throttled hover state setter to prevent rapid updates
  const throttledSetHoveredNode = useMemo(
    () =>
      throttle((node: GraphNode | null) => {
        setHoveredNode(node);
      }, 100), // 100ms throttle - max 10 updates per second
    []
  );

  // Keep ref updated for use in graph callback
  useEffect(() => {
    throttledSetHoveredNodeRef.current = throttledSetHoveredNode;
  }, [throttledSetHoveredNode]);

  // Throttled mouse position for tooltip
  const throttledSetMousePos = useMemo(
    () =>
      throttle((pos: { x: number; y: number }) => {
        setMousePos(pos);
      }, 32), // ~30fps for tooltip position
    []
  );

  // Track mouse position for tooltip
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (hoveredNode) {
        throttledSetMousePos({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [hoveredNode, throttledSetMousePos]);

  // Initialize graph ONCE
  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    // Set a timeout for loading - if it takes too long, show error
    const loadTimeout: NodeJS.Timeout = setTimeout(() => {
      if (mounted && isLoading) {
        setLoadError("Graph taking too long to load. Try enabling Performance Mode.");
        setIsLoading(false);
      }
    }, 15000); // 15 second timeout

    import("3d-force-graph")
      .then((module) => {
        if (!mounted || !containerRef.current) return;
        clearTimeout(loadTimeout);

        try {
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
            .nodeResolution(perfSettings.nodeResolution)
            .nodeThreeObject((node: any) => {
              const n = node as GraphNode;

              // CRITICAL: Return cached object if it exists - prevents recreation
              if ((n as any).__threeObj) {
                return (n as any).__threeObj;
              }

              const isShared = n.type === "borrower" && (n.fundCount ?? 0) > 1;
              const color = n.color;
              const isMobile = perfSettingsRef.current.isMobile;

              // Calculate size once - this won't change
              const coreSize = n.type === "fund" ? 4 : isShared ? 2 + (n.fundCount ?? 0) * 0.5 : 1;
              const segments = perfSettingsRef.current.sphereSegments;

              // Use shared geometry - massive performance improvement
              const coreGeometry = getCachedGeometry(coreSize, segments);
              const coreMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color(color),
                transparent: true,
                opacity: 1,
              });
              const core = new THREE.Mesh(coreGeometry, coreMaterial);
              core.name = "core"; // Tag for later updates

              // For mobile/performance mode: just return the mesh, no group overhead
              if (isMobile) {
                (n as any).__threeObj = core;
                return core;
              }

              const group = new THREE.Group();
              group.add(core);

              // Only add glow effects if enabled (disabled in performance mode)
              if (perfSettingsRef.current.enableGlow) {
                const spriteMaterial = new THREE.SpriteMaterial({
                  map: getCachedGlowTexture(color),
                  transparent: true,
                  blending: THREE.AdditiveBlending,
                  opacity: isShared ? 0.6 : 0.3,
                });
                const sprite = new THREE.Sprite(spriteMaterial);
                sprite.name = "glow"; // Tag for later updates
                const glowSize = coreSize * (isShared ? 8 : 5);
                sprite.scale.set(glowSize, glowSize, 1);
                group.add(sprite);
              }

              if (n.type === "fund" && n.ticker) {
                // Clean minimal label using SpriteText
                const label = new SpriteText(n.ticker, 8, "#ffffff");
                label.fontFace = "Inter, system-ui, sans-serif";
                label.fontWeight = "600";
                label.backgroundColor = false; // Transparent background
                label.strokeWidth = 0.5; // Subtle outline for readability
                label.strokeColor = "rgba(0,0,0,0.8)";
                label.position.set(0, coreSize + 8, 0);
                label.name = "label";
                group.add(label);
              }

              // Cache on the node itself
              (n as any).__threeObj = group;

              return group;
            })
            .linkColor((link: any) => {
              const l = link as GraphLink;
              const sourceId = typeof l.source === "string" ? l.source : l.source.id;
              const targetId = typeof l.target === "string" ? l.target : l.target.id;
              const isFundToFund = sourceId.startsWith("f") && targetId.startsWith("f");

              if (focusedFundIdsRef.current) {
                const isConnected =
                  focusedFundIdsRef.current.has(sourceId) &&
                  focusedFundIdsRef.current.has(targetId);
                if (isConnected) {
                  return isFundToFund ? "rgba(16, 185, 129, 0.8)" : "rgba(255,255,255,0.5)";
                }
                return "rgba(255,255,255,0.02)";
              }

              if (highlightedIdsRef.current) {
                const isConnected =
                  highlightedIdsRef.current.has(sourceId) &&
                  highlightedIdsRef.current.has(targetId);
                if (isConnected) {
                  return isFundToFund ? "rgba(16, 185, 129, 0.8)" : "rgba(255,255,255,0.4)";
                }
                return isFundToFund ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.02)";
              }

              if (searchMatchIdsRef.current) {
                const matches =
                  searchMatchIdsRef.current.has(sourceId) ||
                  searchMatchIdsRef.current.has(targetId);
                return matches ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.02)";
              }

              return isFundToFund ? l.color : "rgba(255,255,255,0.04)";
            })
            .linkWidth((link: any) => {
              const l = link as GraphLink;
              const sourceId = typeof l.source === "string" ? l.source : l.source.id;
              const targetId = typeof l.target === "string" ? l.target : l.target.id;
              const isFundToFund = sourceId.startsWith("f") && targetId.startsWith("f");

              if (
                focusedFundIdsRef.current &&
                focusedFundIdsRef.current.has(sourceId) &&
                focusedFundIdsRef.current.has(targetId)
              ) {
                return isFundToFund ? 3 : 2;
              }

              if (
                highlightedIdsRef.current &&
                highlightedIdsRef.current.has(sourceId) &&
                highlightedIdsRef.current.has(targetId)
              ) {
                return isFundToFund ? 3 : 1.5;
              }
              return isFundToFund ? 1.5 : 0.3;
            })
            .linkOpacity(0.6)
            // Particles disabled - significant performance impact
            .linkDirectionalParticles(0)
            .onNodeClick((node: any) => {
              const n = node as GraphNode;
              if (n.type === "fund") {
                onFundFocusRef.current?.(focusedFundIdRef.current === n.id ? null : n.id);
              }
              onNodeClickRef.current?.(n);
            })
            .onNodeHover((node: any) => {
              // Disable hover on mobile to prevent touch interference
              if (!perfSettingsRef.current.enableHover) return;
              // Use throttled setter to prevent rapid state updates
              throttledSetHoveredNodeRef.current(node as GraphNode | null);
              onNodeHoverRef.current?.(node as GraphNode | null);
              if (containerRef.current) {
                containerRef.current.style.cursor = node ? "pointer" : "default";
              }
            })
            .cooldownTicks(perfSettings.cooldownTicks)
            .warmupTicks(perfSettings.isMobile ? 50 : 0) // Pre-compute layout on mobile
            .enableNodeDrag(!perfSettings.isMobile) // Disable drag on mobile for performance
            .onEngineStop(() => {
              graph.cameraPosition({ x: 0, y: 0, z: 800 }, { x: 0, y: 0, z: 0 }, 1500);
            });

          // Apply performance renderer settings
          const renderer = graph.renderer();
          if (renderer) {
            renderer.setPixelRatio(perfSettings.pixelRatio);
            // Disable antialiasing for better mobile performance (set at creation time, but this helps)
          }

          // Configure force simulation - lighter forces for better performance
          const chargeStrength = performanceMode ? -30 : -40;
          graph.d3Force("charge")?.strength(chargeStrength);
          graph.d3Force("link")?.distance(performanceMode ? 50 : 60);
          graph.d3Force("center")?.strength(0.03);

          // Improve OrbitControls for smoother navigation
          const controls = graph.controls();
          controls.enableDamping = true;
          controls.dampingFactor = 0.08; // Smoother deceleration
          controls.rotateSpeed = 0.6;
          controls.zoomSpeed = 1.0; // Slightly faster zoom
          controls.minDistance = 100;
          controls.maxDistance = 2000;
          // Touch-specific settings for mobile
          controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          };
          controls.enablePan = true;
          controls.panSpeed = 0.8;
          // Smoother auto-rotation when idle (optional, disabled by default)
          controls.autoRotate = false;
          controls.autoRotateSpeed = 0.5;

          graphRef.current = graph;
          setIsLoading(false);

          // Debounced resize handler for better performance
          let resizeTimeout: NodeJS.Timeout;
          const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
              if (containerRef.current && graphRef.current) {
                graphRef.current.width(containerRef.current.offsetWidth);
              }
            }, 100);
          };

          // Pause animation when tab is hidden (battery saver)
          const handleVisibilityChange = () => {
            if (graphRef.current) {
              if (document.hidden) {
                graphRef.current.pauseAnimation();
              } else {
                graphRef.current.resumeAnimation();
              }
            }
          };

          window.addEventListener("resize", handleResize);
          document.addEventListener("visibilitychange", handleVisibilityChange);

          return () => {
            clearTimeout(resizeTimeout);
            window.removeEventListener("resize", handleResize);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
          };
        } catch (err) {
          console.error("Failed to initialize graph:", err);
          setLoadError("Failed to load 3D graph. Your device may not support WebGL.");
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load 3d-force-graph:", err);
        setLoadError("Failed to load graph library.");
        setIsLoading(false);
      });

    return () => {
      mounted = false;
      clearTimeout(loadTimeout);
      if (graphRef.current) {
        graphRef.current.pauseAnimation?.();
        graphRef.current._destructor?.();
        graphRef.current = null;
      }
      // Clear all caches on unmount to free GPU memory
      clearGraphCaches();
    };
    // Re-initialize on height or performance mode change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, performanceMode]);

  // Update graph data when filters change (without recreating graph)
  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current.graphData(filteredData);
  }, [filteredData]);

  // Ref for debouncing highlight updates
  const highlightUpdateRef = useRef<number | null>(null);

  // Update node visuals when highlights change - WITHOUT recreating objects
  // This directly mutates materials which is the Three.js best practice
  useEffect(() => {
    if (!graphRef.current) return;

    // Cancel any pending update
    if (highlightUpdateRef.current) {
      cancelAnimationFrame(highlightUpdateRef.current);
    }

    // Debounce with double RAF for smoother updates (waits for next frame)
    highlightUpdateRef.current = requestAnimationFrame(() => {
      highlightUpdateRef.current = requestAnimationFrame(() => {
        if (!graphRef.current) return;

        const graphData = graphRef.current.graphData();
        if (!graphData?.nodes) return;

        // Get current highlight state once (avoid repeated ref access)
        const focusedIds = focusedFundIdsRef.current;
        const highlightIds = highlightedIdsRef.current;
        const searchIds = searchMatchIdsRef.current;

        graphData.nodes.forEach((node: any) => {
          const n = node as GraphNode;
          const threeObj = (n as any).__threeObj as THREE.Object3D | undefined;
          if (!threeObj) return;

          // Determine if this node should be dimmed
          const shouldDim =
            (focusedIds && !focusedIds.has(n.id)) ||
            (highlightIds && !highlightIds.has(n.id)) ||
            (searchIds && !searchIds.has(n.id));

          // Handle both mesh-only (mobile) and group (desktop) cases
          if (threeObj instanceof THREE.Mesh) {
            // Mobile: direct mesh
            const mat = threeObj.material as THREE.MeshBasicMaterial;
            mat.color.set(shouldDim ? 0x1a1a1a : n.color);
            mat.opacity = shouldDim ? 0.2 : 1;
          } else {
            // Desktop: group with children
            const core = threeObj.getObjectByName("core") as THREE.Mesh | undefined;
            if (core && core.material) {
              const mat = core.material as THREE.MeshBasicMaterial;
              mat.color.set(shouldDim ? 0x1a1a1a : n.color);
              mat.opacity = shouldDim ? 0.2 : 1;
            }

            // Update glow sprite
            const glow = threeObj.getObjectByName("glow") as THREE.Sprite | undefined;
            if (glow) {
              glow.visible = !shouldDim;
            }

            // Update label
            const label = threeObj.getObjectByName("label") as THREE.Sprite | undefined;
            if (label && label.material) {
              (label.material as THREE.SpriteMaterial).opacity = shouldDim ? 0.3 : 1;
            }
          }
        });

        // Only update link colors (cheap operation)
        graphRef.current.linkColor(graphRef.current.linkColor());
        graphRef.current.linkWidth(graphRef.current.linkWidth());
      });
    });

    return () => {
      if (highlightUpdateRef.current) {
        cancelAnimationFrame(highlightUpdateRef.current);
      }
    };
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
            className="w-80 px-4 py-2 bg-black border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors font-mono"
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

      <div ref={containerRef} className="w-full overflow-hidden" style={{ height }} />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border border-cyan-500/20 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-t border-cyan-400 rounded-full animate-spin" />
              <div className="absolute inset-3 w-10 h-10 border border-pink-500/20 rounded-full" />
              <div
                className="absolute inset-3 w-10 h-10 border-t border-pink-400 rounded-full animate-spin"
                style={{ animationDirection: "reverse", animationDuration: "0.6s" }}
              />
            </div>
            <div className="text-xs font-mono text-zinc-600 tracking-wider">INITIALIZING WEBGL</div>
            <div className="text-[10px] font-mono text-zinc-700">
              {filteredData.nodes.length} nodes · {filteredData.links.length} links
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-4 p-6 max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="text-sm text-zinc-400">{loadError}</div>
            <button
              onClick={() => {
                setLoadError(null);
                setIsLoading(true);
                // Force re-render by toggling a key or similar
                window.location.reload();
              }}
              className="px-4 py-2 bg-zinc-800 text-white text-sm rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      {/* Focus mode indicator */}
      {focusedFundId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-black/90 border border-cyan-500/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm text-cyan-300 font-medium">
              Focus: {filteredData.nodes.find((n) => n.id === focusedFundId)?.ticker || "Fund"}
            </span>
            <button
              onClick={() => onFundFocus?.(null)}
              className="ml-2 text-cyan-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Zoom controls - larger touch targets for mobile */}
      {!isLoading && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => {
              if (graphRef.current) {
                const camera = graphRef.current.camera();
                graphRef.current.cameraPosition(
                  {
                    x: camera.position.x * 0.7,
                    y: camera.position.y * 0.7,
                    z: camera.position.z * 0.7,
                  },
                  { x: 0, y: 0, z: 0 },
                  300
                );
              }
            }}
            className="w-11 h-11 md:w-8 md:h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 active:scale-95 transition-colors touch-target"
            aria-label="Zoom in"
          >
            <svg
              className="w-5 h-5 md:w-4 md:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v12M6 12h12"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              if (graphRef.current) {
                const camera = graphRef.current.camera();
                graphRef.current.cameraPosition(
                  {
                    x: camera.position.x * 1.4,
                    y: camera.position.y * 1.4,
                    z: camera.position.z * 1.4,
                  },
                  { x: 0, y: 0, z: 0 },
                  300
                );
              }
            }}
            className="w-11 h-11 md:w-8 md:h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 active:scale-95 transition-colors touch-target"
            aria-label="Zoom out"
          >
            <svg
              className="w-5 h-5 md:w-4 md:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={resetCamera}
            className="w-11 h-11 md:w-8 md:h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 active:scale-95 transition-colors touch-target text-sm md:text-[10px] font-mono"
            aria-label="Reset camera"
          >
            ⟲
          </button>
        </div>
      )}

      {/* Hover tooltip - GPU-accelerated positioning */}
      {hoveredNode && (
        <div
          className="fixed z-50 bg-black/95 border border-zinc-700/50 rounded-lg p-4 shadow-2xl pointer-events-none max-w-[calc(100vw-2rem)] md:max-w-60 will-change-transform"
          style={{
            transform: `translate3d(${Math.min(Math.max(16, mousePos.x + 16), (typeof window !== "undefined" ? window.innerWidth : 1000) - 260)}px, ${Math.min(Math.max(16, mousePos.y + 16), (typeof window !== "undefined" ? window.innerHeight : 800) - 200)}px, 0)`,
            left: 0,
            top: 0,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: hoveredNode.color,
                boxShadow: `0 0 8px ${hoveredNode.color}`,
              }}
            />
            <span className="text-[9px] font-medium tracking-wider text-zinc-500 uppercase">
              {hoveredNode.type === "fund"
                ? "Fund"
                : hoveredNode.fundCount && hoveredNode.fundCount > 1
                  ? "Shared"
                  : "Position"}
            </span>
          </div>

          <h3 className="text-base font-semibold text-white leading-tight">
            {hoveredNode.type === "fund" ? hoveredNode.ticker : hoveredNode.name}
          </h3>
          {hoveredNode.type === "fund" && (
            <p className="text-zinc-500 text-xs mt-0.5">{hoveredNode.name}</p>
          )}

          {hoveredNode.type === "borrower" &&
            hoveredNode.industry &&
            hoveredNode.industry !== "Unknown" && (
              <p className="text-zinc-500 text-xs mt-2 line-clamp-2">{hoveredNode.industry}</p>
            )}

          {hoveredNode.fairValue && hoveredNode.fairValue > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-800/50 flex justify-between items-baseline">
              <span className="text-[9px] font-medium tracking-wider text-zinc-600 uppercase">
                Exposure
              </span>
              <span className="text-lg font-semibold text-white">
                $
                {hoveredNode.fairValue >= 1000
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
                $
                {hoveredNode.totalAssets >= 1000
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
                  <span className="text-[10px] text-zinc-600">
                    +{connectedInfo.funds.length - 4}
                  </span>
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

// Create glow texture for sprites (internal, used by cache)
function createGlowTextureInternal(color: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  // Smaller texture size for better performance
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.2, color + "80");
  gradient.addColorStop(0.5, color + "20");
  gradient.addColorStop(1, "transparent");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
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
    "#00d4ff",
    "#60a5fa",
    "#a78bfa",
    "#c084fc",
    "#38bdf8",
    "#22d3ee",
    "#818cf8",
    "#67e8f9",
    "#f472b6",
    "#fb923c",
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
