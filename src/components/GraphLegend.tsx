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

const legendItems: LegendItem[] = [
  { color: "#00d4ff", label: "BDC Funds", type: "fund", glow: true },
  { color: "#00ff9f", label: "Shared (2-3 funds)", type: "shared", glow: true },
  { color: "#ff9500", label: "Warning (3+ funds)", type: "warning", glow: true },
  { color: "#ff3366", label: "Critical (4+ funds)", type: "critical", glow: true },
  { color: "#334155", label: "Single-fund", type: "single" },
];

const linkTypes = [
  { color: "#10b981", label: "Fund-to-fund", style: "solid" },
  { color: "rgba(255,255,255,0.1)", label: "Fund-to-borrower", style: "dotted" },
];

export function GraphLegend({ onFilterByType, activeType }: GraphLegendProps) {
  return (
    <div className="space-y-4">
      {/* Node types */}
      <div>
        <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2 font-medium">
          Nodes
        </div>
        <div className="space-y-1.5">
          {legendItems.map((item) => (
            <button
              key={item.type}
              onClick={() => onFilterByType?.(activeType === item.type ? null : item.type)}
              className={`flex items-center gap-2 w-full text-left group transition-all ${
                activeType && activeType !== item.type ? "opacity-40" : "opacity-100"
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: item.color,
                  boxShadow: item.glow ? `0 0 6px ${item.color}80` : "none",
                }}
              />
              <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                {item.label}
              </span>
              {activeType === item.type && (
                <span className="text-[9px] text-cyan-500 ml-auto">active</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Link types */}
      <div>
        <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2 font-medium">
          Connections
        </div>
        <div className="space-y-1.5">
          {linkTypes.map((link) => (
            <div key={link.label} className="flex items-center gap-2">
              <div className="w-5 h-0.5 flex-shrink-0 relative">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: link.color,
                    borderStyle: link.style === "dotted" ? "dashed" : "solid",
                  }}
                />
              </div>
              <span className="text-[11px] text-zinc-600">{link.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
