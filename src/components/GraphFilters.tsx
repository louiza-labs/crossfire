"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

export interface GraphFilterState {
  showFundLinks: boolean;
  showSingleFundBorrowers: boolean;
  industryFilter: string | null;
  minExposure: number;
}

interface GraphFiltersProps {
  filters: GraphFilterState;
  onChange: (filters: GraphFilterState) => void;
  industries: string[];
  inline?: boolean;
}

// Minimal checkbox component
function Checkbox({
  checked,
  onChange,
  label,
  colorDot,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  colorDot?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 w-full text-left group"
    >
      <div
        className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center transition-all duration-200 ${
          checked
            ? "bg-[#e0f2fe] border-[#e0f2fe]"
            : "bg-transparent border-white/20 group-hover:border-white/40"
        }`}
      >
        {checked && <Check className="w-2.5 h-2.5 text-[#050506] stroke-[3]" />}
      </div>
      <span
        className={`text-[11px] transition-colors duration-200 ${
          checked ? "text-white/80" : "text-white/40 group-hover:text-white/60"
        }`}
      >
        {label}
      </span>
      {colorDot && (
        <span
          className="w-1.5 h-1.5 rounded-full ml-auto opacity-60"
          style={{ backgroundColor: colorDot }}
        />
      )}
    </button>
  );
}

export function GraphFilters({ filters, onChange, industries, inline = false }: GraphFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateFilter = <K extends keyof GraphFilterState>(key: K, value: GraphFilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.industryFilter ||
    filters.minExposure > 0 ||
    !filters.showFundLinks ||
    !filters.showSingleFundBorrowers;

  // Inline mode - just render the filter controls without wrapper
  if (inline) {
    return (
      <div className="space-y-4">
        <Checkbox
          checked={filters.showFundLinks}
          onChange={(checked) => updateFilter("showFundLinks", checked)}
          label="Fund connections"
          colorDot="#4ade80"
        />
        <Checkbox
          checked={filters.showSingleFundBorrowers}
          onChange={(checked) => updateFilter("showSingleFundBorrowers", checked)}
          label="Single-fund positions"
          colorDot="#52525b"
        />
        <div className="pt-1">
          <label className="text-[9px] text-white/30 uppercase tracking-[0.14em] block mb-2 font-medium">
            Industry
          </label>
          <select
            value={filters.industryFilter || ""}
            onChange={(e) => updateFilter("industryFilter", e.target.value || null)}
            className="w-full h-8 text-[11px] bg-white/[0.03] border border-white/[0.06] text-white/80 rounded-md px-2.5 focus:outline-none focus:border-white/[0.12] transition-all duration-200 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.3)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
              backgroundSize: "16px",
              paddingRight: "32px",
            }}
          >
            <option value="">All Industries</option>
            {industries.slice(0, 25).map((ind) => (
              <option key={ind} value={ind}>
                {ind.length > 28 ? ind.slice(0, 28) + "…" : ind}
              </option>
            ))}
          </select>
        </div>
        <div className="pt-1">
          <label className="text-[9px] text-white/30 uppercase tracking-[0.14em] block mb-2 font-medium">
            Min Exposure: <span className="text-white/60">${filters.minExposure}M+</span>
          </label>
          <input
            type="range"
            min={0}
            max={500}
            step={10}
            value={filters.minExposure}
            onChange={(e) => updateFilter("minExposure", Number(e.target.value))}
            className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#e0f2fe] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
          />
          <div className="flex justify-between text-[9px] text-white/20 mt-1.5 font-mono">
            <span>$0</span>
            <span>$500M+</span>
          </div>
        </div>
        {hasActiveFilters && (
          <button
            onClick={() =>
              onChange({
                showFundLinks: true,
                showSingleFundBorrowers: true,
                industryFilter: null,
                minExposure: 0,
              })
            }
            className="text-[10px] text-[#e0f2fe]/70 hover:text-[#e0f2fe] transition-colors duration-200"
          >
            Reset all
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-white/[0.04] pt-5 mt-5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-white/35 uppercase tracking-[0.14em] font-medium group-hover:text-white/50 transition-colors duration-200">
            Filters
          </span>
          {hasActiveFilters && <span className="w-1 h-1 rounded-full bg-[#e0f2fe]" />}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 text-white/30" />
        ) : (
          <ChevronDown className="w-3 h-3 text-white/30" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Toggle: Fund-to-fund links */}
          <Checkbox
            checked={filters.showFundLinks}
            onChange={(checked) => updateFilter("showFundLinks", checked)}
            label="Fund connections"
            colorDot="#4ade80"
          />

          {/* Toggle: Single-fund borrowers */}
          <Checkbox
            checked={filters.showSingleFundBorrowers}
            onChange={(checked) => updateFilter("showSingleFundBorrowers", checked)}
            label="Single-fund positions"
            colorDot="#52525b"
          />

          {/* Industry filter */}
          <div className="pt-1">
            <label className="text-[9px] text-white/30 uppercase tracking-[0.14em] block mb-2 font-medium">
              Industry
            </label>
            <select
              value={filters.industryFilter || ""}
              onChange={(e) => updateFilter("industryFilter", e.target.value || null)}
              className="w-full h-8 text-[11px] bg-white/[0.03] border border-white/[0.06] text-white/80 rounded-md px-2.5 focus:outline-none focus:border-white/[0.12] transition-all duration-200 appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.3)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                backgroundSize: "16px",
                paddingRight: "32px",
              }}
            >
              <option value="">All Industries</option>
              {industries.slice(0, 25).map((ind) => (
                <option key={ind} value={ind}>
                  {ind.length > 28 ? ind.slice(0, 28) + "…" : ind}
                </option>
              ))}
            </select>
          </div>

          {/* Exposure slider */}
          <div className="pt-1">
            <label className="text-[9px] text-white/30 uppercase tracking-[0.14em] block mb-2 font-medium">
              Min Exposure: <span className="text-white/60">${filters.minExposure}M+</span>
            </label>
            <input
              type="range"
              min={0}
              max={500}
              step={10}
              value={filters.minExposure}
              onChange={(e) => updateFilter("minExposure", Number(e.target.value))}
              className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#e0f2fe] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
            />
            <div className="flex justify-between text-[9px] text-white/20 mt-1.5 font-mono">
              <span>$0</span>
              <span>$500M+</span>
            </div>
          </div>

          {/* Reset filters */}
          {hasActiveFilters && (
            <button
              onClick={() =>
                onChange({
                  showFundLinks: true,
                  showSingleFundBorrowers: true,
                  industryFilter: null,
                  minExposure: 0,
                })
              }
              className="text-[10px] text-[#e0f2fe]/70 hover:text-[#e0f2fe] transition-colors duration-200"
            >
              Reset all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export const defaultFilters: GraphFilterState = {
  showFundLinks: true,
  showSingleFundBorrowers: true,
  industryFilter: null,
  minExposure: 0,
};
