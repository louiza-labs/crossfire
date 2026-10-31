"use client";

import { useMemo } from "react";

interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  maxBars?: number;
  height?: number;
  formatValue?: (value: number) => string;
  title?: string;
}

export function BarChart({
  data,
  maxBars = 10,
  height = 200,
  formatValue = (v) => v.toFixed(0),
  title,
}: BarChartProps) {
  const displayData = useMemo(() => {
    return data.slice(0, maxBars);
  }, [data, maxBars]);

  const maxValue = useMemo(() => {
    return Math.max(...displayData.map((d) => d.value), 1);
  }, [displayData]);

  if (displayData.length === 0) return null;

  return (
    <div>
      {title && (
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
          {title}
        </h3>
      )}
      <div className="space-y-2" style={{ height }}>
        {displayData.map((item, idx) => {
          const widthPercent = (item.value / maxValue) * 100;
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-16 text-xs text-zinc-400 truncate text-right">
                {item.label}
              </div>
              <div className="flex-1 h-5 bg-zinc-800/50 rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-500 ease-out"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: item.color || "#00d4ff",
                    boxShadow: `0 0 10px ${item.color || "#00d4ff"}40`,
                  }}
                />
              </div>
              <div className="w-16 text-xs text-zinc-300 tabular-nums">
                {formatValue(item.value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
