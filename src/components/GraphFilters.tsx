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
}

// Custom checkbox component with clear visual feedback
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
      className="flex items-center gap-2 w-full text-left group"
    >
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
          checked
            ? "bg-cyan-500 border-cyan-500"
            : "bg-zinc-900 border-zinc-700 group-hover:border-zinc-500"
        }`}
      >
        {checked && <Check className="w-3 h-3 text-black stroke-[3]" />}
      </div>
      <span
        className={`text-xs transition-colors ${
          checked ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-300"
        }`}
      >
        {label}
      </span>
      {colorDot && (
        <span
          className="w-1.5 h-1.5 rounded-full ml-auto"
          style={{ backgroundColor: colorDot }}
        />
      )}
    </button>
  );
}

export function GraphFilters({ filters, onChange, industries }: GraphFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateFilter = <K extends keyof GraphFilterState>(
    key: K,
    value: GraphFilterState[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.industryFilter ||
    filters.minExposure > 0 ||
    !filters.showFundLinks ||
    !filters.showSingleFundBorrowers;

  return (
    <div className="border-t border-zinc-800/50 pt-4 mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium group-hover:text-zinc-400 transition-colors">
            Filters
          </span>
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 text-zinc-600" />
        ) : (
          <ChevronDown className="w-3 h-3 text-zinc-600" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Toggle: Fund-to-fund links */}
          <Checkbox
            checked={filters.showFundLinks}
            onChange={(checked) => updateFilter("showFundLinks", checked)}
            label="Fund connections"
            colorDot="#10b981"
          />

          {/* Toggle: Single-fund borrowers */}
          <Checkbox
            checked={filters.showSingleFundBorrowers}
            onChange={(checked) => updateFilter("showSingleFundBorrowers", checked)}
            label="Single-fund positions"
            colorDot="#52525b"
          />

          {/* Industry filter */}
          <div>
            <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-1.5">
              Industry
            </label>
            <select
              value={filters.industryFilter || ""}
              onChange={(e) => updateFilter("industryFilter", e.target.value || null)}
              className="w-full h-7 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2 focus:outline-none focus:border-zinc-600 transition-colors"
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
          <div>
            <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-1.5">
              Min Exposure: ${filters.minExposure}M+
            </label>
            <input
              type="range"
              min={0}
              max={500}
              step={10}
              value={filters.minExposure}
              onChange={(e) => updateFilter("minExposure", Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[9px] text-zinc-700 mt-0.5">
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
              className="text-[10px] text-cyan-500 hover:text-cyan-400 transition-colors"
            >
              Reset all filters
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
