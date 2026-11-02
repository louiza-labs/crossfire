"use client";

interface LegendItem {
  color: string;
  label: string;
  type: string;
  glow?: boolean;
}

interface GraphLegendProps {
  onFilterByType?: (type: string | null) => void;
  activeType?: string | null;
}

// More muted, futuristic color palette
const legendItems: LegendItem[] = [
  { color: "#e0f2fe", label: "BDC Funds", type: "fund", glow: true },
  { color: "#86efac", label: "Shared (2-3)", type: "shared", glow: true },
  { color: "#fbbf24", label: "Warning (3+)", type: "warning", glow: true },
  { color: "#f87171", label: "Critical (4+)", type: "critical", glow: true },
  { color: "#404040", label: "Single-fund", type: "single" },
];

const linkTypes = [
  { color: "#4ade80", label: "Fund-to-fund", style: "solid" },
  { color: "rgba(255,255,255,0.08)", label: "Position link", style: "dotted" },
];

export function GraphLegend({ onFilterByType, activeType }: GraphLegendProps) {
  return (
    <div className="space-y-5">
      {/* Node types */}
      <div>
        <div className="text-[9px] text-white/30 uppercase tracking-[0.14em] mb-3 font-medium">
          Nodes
        </div>
        <div className="space-y-2">
          {legendItems.map((item) => (
            <button
              key={item.type}
              onClick={() => onFilterByType?.(activeType === item.type ? null : item.type)}
              className={`flex items-center gap-2.5 w-full text-left group transition-all duration-200 ${
                activeType && activeType !== item.type ? "opacity-30" : "opacity-100"
              }`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: item.color,
                  boxShadow: item.glow ? `0 0 8px ${item.color}40` : "none",
                }}
              />
              <span className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors duration-200">
                {item.label}
              </span>
              {activeType === item.type && (
                <span className="text-[8px] text-[#e0f2fe]/60 ml-auto tracking-wider uppercase">
                  active
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Link types */}
      <div>
        <div className="text-[9px] text-white/30 uppercase tracking-[0.14em] mb-3 font-medium">
          Links
        </div>
        <div className="space-y-2">
          {linkTypes.map((link) => (
            <div key={link.label} className="flex items-center gap-2.5">
              <div className="w-4 h-px flex-shrink-0 relative">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: link.color,
                    borderStyle: link.style === "dotted" ? "dashed" : "solid",
                  }}
                />
              </div>
              <span className="text-[10px] text-white/40">{link.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
